// import * as IpcApiFactory from "./IpcApiFactory";

// IpcApiFactory.implementSyncApi( "writeResultToStdOutAndExit", (result) => {
//   process.stdout.write(result);
//   process.stdout.write('\n');
//   process.exit(0)
// });

export const writeResultToStdOutAndExit = (result: string) => {
  process.stdout.write(result);
  process.stdout.write('\n');
  process.exit(0)  
}

// IpcApiFactory.implementSyncApi( "getCommandLineArguments", () => {
//   /**
//     When executed with electron command the first two arguments are the path and the executable name,
//     so the actual command line arguments start at index 2. When executed as packed binary the actual
//     command line arguments start at index 1.
//     See: https://nodejs.org/docs/latest/api/process.html#process_process_argv.
//     The constant represents only the arguments that follow the path and executable name.
//   */
//   const argv = process.argv
//   if(argv[0].toLowerCase().endsWith("electron")){
//       return argv.slice(2)
//   }else{
//       return argv.slice(1)
//   }
// });
