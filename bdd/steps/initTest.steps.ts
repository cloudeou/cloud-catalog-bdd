import { StepDefinitions } from 'jest-cucumber';
import { Identificators } from '../contexts/Identificators';
import InitContext from '../contexts/InitContext';
const {
    featureContext,
    postgresQueryExecutor,
} = require("@telus-bdd/telus-bdd");

export const initTestSteps: StepDefinitions = ({ given, and, when, then }) => {

    let initContext = (): InitContext =>
        featureContext().getContextById(Identificators.initContext);

    given(/^A is (\d+)$/, (arg0) => {
        initContext().setA(parseInt(arg0, 10));
    });

    and(/^B is (\d+)$/, (arg0) => {
        initContext().setB(parseInt(arg0, 10));
    });

    when('A + B', () => {
        let A = initContext().getA();
        let B = initContext().getB();
        let result = A + B;
        initContext().setResult(result);
    });

    when('A - B', () => {
        let A = initContext().getA();
        let B = initContext().getB();
        let result = A - B;
        initContext().setResult(result);
    });

    then(/^Result should be (\d+)$/, (arg0) => {
        let result = initContext().getResult();
        expect(result).toBe(parseInt(arg0, 10));
    });

};