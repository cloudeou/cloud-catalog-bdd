const args = JSON.parse(process.env.npm_config_argv);
module.exports = {
	featuresPath: "./_test_specs/features",
	stepsPath: "./dist/bdd/steps",
	envsPath: '',
	contextsPath: "./dist/bdd/contexts",
	threadsNumber: 1,
	//testOrderPath: './dist/src/testOrder.config.json',
	db: {
		user: `${process.env.DB_USER}`,
		database: 'bddplatformdb',
		passwd: `${process.env.DB_PASSWORD}`,
		host: 'localhost',
		port: 5432,
	},
	"bootstrapPath": "./bdd/DBBootstrap.config.js",
	reporters: ['jest-standard-reporter'],
	//reporters: ["default"],
	// testDataGUI: {
	// 	"host": "localhost",
	// 	"port": 3335
	// },
	webapp: {
		host: '0.0.0.0',
		port: 3334,
	},
	useUReport: false,
	uReportConfig: {
		token: `${args.cooked[args.cooked.indexOf('--token') + 1]}`,
		launch: `${args.cooked[args.cooked.indexOf('--') + 1]?.split('=')[1]}`,
		endpoint: 'https://bdd-jest-auto-np.cloudapps.telus.com/api/v1',
		project: 'BDD_JEST_AUTO_GCP',
		description: 'E2E tests',
		attributes: [
			{
				"value": `ENV ${args.cooked[args.cooked.indexOf('--') + 2]?.split('=')[1]}`
			}
		],
		restClientConfig: {
			agent: { host: "198.161.14.25", port: "8080", rejectUnauthorized: false }
		},
		sendInSequence: true
	},
};