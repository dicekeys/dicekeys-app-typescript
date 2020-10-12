export  const derivationOptionsJsonForAllowedDomains = (hosts: string[], clientMayRetrieveKey: boolean = false) =>  `{${
  clientMayRetrieveKey ? '"clientMayRetrieveKey": true,' : ""
}"allow":[${
  hosts
    .map( host => `{"host":"*.${host}"}`)
    .join(",")
  }]}`;

