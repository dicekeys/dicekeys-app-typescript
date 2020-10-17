export  const restrictionsJson = (hosts?: string[], clientMayRetrieveKey: boolean = false) => (!hosts || hosts.length === 0) ? "" :  `{${
  clientMayRetrieveKey ? '"clientMayRetrieveKey": true,' : ""
}"allow":[${ 
  hosts
    .map( host => `{"host":"*.${host}"}`)
    .join(",")
  }]}`;

