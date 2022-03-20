export class Common {

    async getParamFromCLI(CLIparams, param) {
        let returnParam;
        for (let i = 0; i < CLIparams.length; i++){
            if (CLIparams[i].includes(param)){
                returnParam = CLIparams[i];
            }
        }
        if (returnParam === undefined) {
            throw new Error(
                `Parameter ${param} did not find`,
            );
        }
        returnParam = returnParam.split('=')[1];
        return returnParam;
    }

}

// (async function () {
//     let ret = new Common();
//     let json = await ret.getParamFromCLI(process.argv, 'ienv');
//   console.log(json);
// })()