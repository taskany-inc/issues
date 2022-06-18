export default {
    e2e: {
        baseUrl: `http://${process.env.CYPRESS_baseUrl || 'localhost'}:3000`,
        supportFile: false,
    },
};
