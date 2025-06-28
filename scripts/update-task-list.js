#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const TRACKING_PATH = path.join(__dirname, '..', 'tracking.md');

// Helper to generate indentation for hierarchy
function indent(level) {
  return '&nbsp;'.repeat(level * 2);
}

// Helper to generate a Cursor link
function cursorLink(p) {
  return `[Open](cursor://open?path=${p})`;
}

// Helper to parse the tree text block
function parseTree(treeText) {
  const lines = treeText.split('\n').filter(l => l.trim().length > 0 && !l.trim().startsWith('#'));
  const rows = [];
  for (let line of lines) {
    // Count indentation (each 2 spaces or │/├/└)
    const match = line.match(/^(\s*|[│ ]*)([├└]── )?(.*)$/);
    if (!match) continue;
    const indentLevel = (match[1].replace(/[^ ]/g, '').length / 2) + (match[1].match(/[│]/g) || []).length;
    let name = match[3].trim();
    // Remove trailing comments
    name = name.replace(/#.*$/, '').trim();
    if (!name) continue;
    // Remove trailing slashes for files
    const isDir = name.endsWith('/');
    const pathParts = [];
    let prev = rows.filter(r => r.level < indentLevel);
    if (prev.length > 0) {
      let parent = prev[prev.length - 1];
      pathParts.push(parent.path);
    }
    let parentPath = pathParts.length > 0 ? pathParts.join('/') : '';
    let fullPath = parentPath ? parentPath + '/' + name.replace(/\/$/, '') : name.replace(/\/$/, '');
    rows.push({
      level: indentLevel,
      name,
      isDir,
      path: fullPath
    });
  }
  return rows;
}

// Helper to extract the tree block from tracking.md
function extractTreeBlock(md) {
  const match = md.match(/```text([\s\S]+?)```/);
  return match ? match[1].trim() : null;
}

// Helper to extract the current table from tracking.md
function extractTableBlock(md) {
  const match = md.match(/\| Module[^\n]+\n\|[-| ]+\n([\s\S]+?)(?=\n- ⏳|$)/);
  return match ? match[1].trim() : null;
}

// Helper to parse the current table into a map for preserving user edits
function parseTable(tableBlock) {
  const lines = tableBlock.split('\n').filter(l => l.trim().startsWith('|'));
  const map = {};
  for (let line of lines) {
    const cols = line.split('|').map(c => c.trim());
    // Module, Priority, Status, Cursor Task, Cursor Prompt Link
    if (cols.length < 6) continue;
    map[cols[1]] = {
      priority: cols[2],
      status: cols[3],
      task: cols[4],
      link: cols[5]
    };
  }
  return map;
}

// Main update function
function updateTracking() {
  let md = fs.readFileSync(TRACKING_PATH, 'utf8');
  const treeBlock = extractTreeBlock(md);
  if (!treeBlock) {
    console.error('No tree block found in tracking.md');
    return;
  }
  const rows = parseTree(treeBlock);
  // Extract and parse the current table for user edits
  const tableBlock = extractTableBlock(md);
  const userMap = tableBlock ? parseTable(tableBlock) : {};

  // Table header
  let table = '| Module | Priority | Status | Cursor Task | Cursor Prompt Link |\n';
  table += '|--------|----------|--------|-------------|-------------------|\n';

  for (const row of rows) {
    const display = indent(row.level) + row.name;
    const prev = userMap[display] || {};
    // Auto-fill if empty, else preserve user edits
    const priority = prev.priority || '';
    const status = prev.status || '⏳';
    const task = prev.task || '';
    const link = cursorLink(row.path);
    table += `| ${display} | ${priority} | ${status} | ${task} | ${link} |\n`;
  }

  // Replace the table in the markdown
  md = md.replace(/\| Module[^\n]+\n\|[-| ]+\n([\s\S]+?)(?=\n- ⏳|$)/, table.trim());
  fs.writeFileSync(TRACKING_PATH, md, 'utf8');
  console.log('✅ tracking.md table updated from tree.');
}

if (require.main === module) {
  updateTracking();
}
