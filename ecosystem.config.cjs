module.exports = {
    apps: [{
        name: "bandhan-mcp",
        script: "./server.js",
        instances: "max", // Uses all CPU cores to handle maximum traffic
        exec_mode: "cluster", // Enables load balancing across cores
        env: {
            NODE_ENV: "development",
        },
        env_production: {
            NODE_ENV: "production",
            MOCK_AI: "false"
        },
        combine_logs: true,
        out_file: "./logs/out.log",
        error_file: "./logs/error.log",
        max_memory_restart: "1G" // Restarts if memory usage leaks
    }]
}
