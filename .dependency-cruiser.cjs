/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
    forbidden: [
        { name: "no-cycles", severity: "error", from: {}, to: { circular: true } },
        {
            name: "frontend-no-backend-imports",
            from: { path: "^apps/frontend" },
            to: { path: "^packages/backend" },
            severity: "error"
        }
    ],
    options: {
        doNotFollow: { path: "node_modules" },
        tsConfig: { fileName: "tsconfig.base.json" },
        exclude: {
            path: ".*\\.(png|jpg|jpeg|gif|svg|ico|webp)$|.*icons.*"
        }
    }
};
