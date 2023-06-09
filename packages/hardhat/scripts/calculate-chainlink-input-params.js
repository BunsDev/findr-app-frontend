const ethcrypto = require("eth-crypto");
const axios = require("axios");
const fs = require("fs").promises;

//Use this to create encrypted secrets for the Chainlink calls on the frontend. Keep the created gist forever
async function main() {
  const source = await fs.readFile("./scripts/OpenAI-custom-chainlink-request.js", "utf8");
  console.log("Source: " + source);
  const secrets = { apiKey: process.env.OPENAI_API_KEY };

  // Provider config currently set for Polygon Mumbai
  const quickNodeApiKey = process.env.QUICKNODE_API_KEY || "oKxs-03sij-U_N0iOlrSsZFr29-IqbuF";
  const provider = new ethers.providers.JsonRpcProvider(
    `https://alien-wild-friday.ethereum-sepolia.discover.quiknode.pro/${quickNodeApiKey}`,
  );

  // Get private wallet key from the .env file
  const signerPrivateKey = process.env.DEPLOYER_PRIVATE_KEY;
  const signer = new ethers.Wallet(signerPrivateKey, provider);

  //Oracle address
  const oracleAddress = "0x649a2C205BE7A3d5e99206CEEFF30c794f0E31EC"; // ETH Sepolia
  const oracleAbiPath = "./artifacts/contracts/dev/functions/FunctionsOracle.sol/FunctionsOracle.json";
  const oracleAbi = JSON.parse(await fs.readFile(oracleAbiPath, "utf8")).abi;
  const oracle = new ethers.Contract(oracleAddress, oracleAbi, signer);

  let encryptedSecrets;
  let doGistCleanup;
  let gistUrl;
  if (typeof secrets !== "undefined") {
    const result = await getEncryptedSecrets(secrets, oracle, signerPrivateKey);
    if (isObject(secrets)) {
      // inline secrets are uploaded to gist by the script so they must be cleanup at the end of the script
      doGistCleanup = true;
      encryptedSecrets = result.encrypted;
      gistUrl = result.gistUrl;
    } else {
      doGistCleanup = false;
      encryptedSecrets = result;
    }
  } else {
    encryptedSecrets = "0x";
  }
  console.log("Encrypted secrets: " + encryptedSecrets);
}

// Encrypt the secrets as defined in requestConfig
// This is a modified version of buildRequest.js from the starter kit:
// ./FunctionsSandboxLibrary/buildRequest.js
// Expects one of the following:
//   - A JSON object with { apiKey: 'your_secret_here' }
//   - An array of secretsURLs
async function getEncryptedSecrets(secrets, oracle, signerPrivateKey = null) {
  // Fetch the DON public key from on-chain
  let DONPublicKey = await oracle.getDONPublicKey();
  // Remove the preceding 0x from the DON public key
  DONPublicKey = DONPublicKey.slice(2);

  // If the secrets object is empty, do nothing, else encrypt secrets
  if (isObject(secrets) && secrets) {
    if (!signerPrivateKey) {
      throw Error("signerPrivateKey is required to encrypt inline secrets");
    }

    const offchainSecrets = {};
    offchainSecrets["0x0"] = Buffer.from(
      await (0, encryptWithSignature)(signerPrivateKey, DONPublicKey, JSON.stringify(secrets)),
      "hex",
    ).toString("base64");

    if (!process.env["GITHUB_API_TOKEN"] || process.env["GITHUB_API_TOKEN"] === "") {
      throw Error("GITHUB_API_TOKEN environment variable not set");
    }

    const secretsURL = await createGist(process.env["GITHUB_API_TOKEN"], offchainSecrets);
    console.log(`Successfully created encrypted secrets Gist: ${secretsURL}`);
    return {
      gistUrl: secretsURL,
      encrypted: "0x" + (await (0, encrypt)(DONPublicKey, `${secretsURL}/raw`)),
    };

    //  return [`${secretsURL}/raw`];
  }
  if (secrets.length > 0) {
    // Remote secrets managed by the user
    if (!Array.isArray(secrets)) {
      throw Error("Unsupported remote secrets format.  Remote secrets must be an array.");
    }
    // Verify off-chain secrets and encrypt if verified
    if (await verifyOffchainSecrets(secrets, oracle)) {
      return "0x" + (await (0, encrypt)(DONPublicKey, secrets.join(" ")));
    } else {
      throw Error("Could not verify off-chain secrets.");
    }
  }

  // Return 0x if no secrets need to be encrypted
  return "0x";
}

// Check each URL in secretsURLs to make sure it is available
// Code is from ./tasks/Functions-client/buildRequestJSON.js
// in the starter kit.
async function verifyOffchainSecrets(secretsURLs, oracle) {
  const [nodeAddresses] = await oracle.getAllNodePublicKeys();
  const offchainSecretsResponses = [];
  for (const url of secretsURLs) {
    try {
      const response = await axios.request({
        url,
        timeout: 3000,
        responseType: "json",
        maxContentLength: 1000000,
      });
      offchainSecretsResponses.push({
        url,
        secrets: response.data,
      });
    } catch (error) {
      throw Error(`Failed to fetch off-chain secrets from ${url}\n${error}`);
    }
  }

  for (const { secrets, url } of offchainSecretsResponses) {
    if (JSON.stringify(secrets) !== JSON.stringify(offchainSecretsResponses[0].secrets)) {
      throw Error(
        `Off-chain secrets URLs ${url} and ${offchainSecretsResponses[0].url} ` +
          `do not contain the same JSON object. All secrets URLs must have an ` +
          `identical JSON object.`,
      );
    }

    for (const nodeAddress of nodeAddresses) {
      if (!secrets[nodeAddress.toLowerCase()]) {
        if (!secrets["0x0"]) {
          throw Error(`No secrets specified for node ${nodeAddress.toLowerCase()} and ` + `no default secrets found.`);
        }
      }
    }
  }
  return true;
}

// Encrypt with the signer private key for sending secrets through an on-chain contract
// Code is from ./FunctionsSandboxLibrary/encryptSecrets.js
async function encryptWithSignature(signerPrivateKey, readerPublicKey, message) {
  const signature = ethcrypto.default.sign(signerPrivateKey, ethcrypto.default.hash.keccak256(message));
  const payload = {
    message,
    signature,
  };
  return await (0, encrypt)(readerPublicKey, JSON.stringify(payload));
}

// Encrypt with the DON public key
// Code is from ./FunctionsSandboxLibrary/encryptSecrets.js
async function encrypt(readerPublicKey, message) {
  const encrypted = await ethcrypto.default.encryptWithPublicKey(readerPublicKey, message);
  return ethcrypto.default.cipher.stringify(encrypted);
}

// create gist
// code from ./tasks/utils
const createGist = async (githubApiToken, encryptedOffchainSecrets) => {
  await checkTokenGistScope(githubApiToken);

  const content = JSON.stringify(encryptedOffchainSecrets);

  const headers = {
    Authorization: `token ${githubApiToken}`,
  };

  // construct the API endpoint for creating a Gist
  const url = "https://api.github.com/gists";
  const body = {
    public: false,
    files: {
      [`encrypted-functions-request-data-${Date.now()}.json`]: {
        content,
      },
    },
  };

  try {
    const response = await axios.post(url, body, { headers });
    const gistUrl = response.data.html_url;
    return gistUrl;
  } catch (error) {
    console.error("Failed to create Gist", error);
    throw new Error("Failed to create Gist");
  }
};

// code from ./tasks/utils
const checkTokenGistScope = async githubApiToken => {
  const headers = {
    Authorization: `Bearer ${githubApiToken}`,
  };

  const response = await axios.get("https://api.github.com/user", { headers });

  if (response.status !== 200) {
    throw new Error(`Failed to get user data: ${response.status} ${response.statusText}`);
  }
  // Github's newly-added fine-grained token do not currently allow for verifying that the token scope is restricted to Gists.
  // This verification feature only works with classic Github tokens and is otherwise ignored
  const scopes = response.headers["x-oauth-scopes"]?.split(", ");

  if (scopes && scopes?.[0] !== "gist") {
    throw Error("The provided Github API token does not have permissions to read and write Gists");
  }

  if (scopes && scopes.length > 1) {
    console.log(
      "WARNING: The provided Github API token has additional permissions beyond reading and writing to Gists",
    );
  }

  return true;
};

function isObject(value) {
  return value !== null && typeof value === "object" && value.constructor === Object;
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
