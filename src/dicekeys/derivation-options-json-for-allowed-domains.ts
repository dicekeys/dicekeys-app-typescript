export  const derivationOptionsJsonForAllowedDomains = (hosts: string[]) =>  `{"allow": [${
  hosts
    .map( host => `{"host":"*.${host}"}`)
    .join(",")
  }]}`;
