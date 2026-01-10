import { defineConfig } from "hardhat/config";

export default defineConfig({
    solidity: {
        version: "0.8.28",
    },

    networks: {
        supraTestnet: {
            type: "http",
            url: "https://rpc-testnet.supra.com",
            accounts: process.env.DEPLOYER_PRIVATE_KEY
                ? [process.env.DEPLOYER_PRIVATE_KEY]
                : [],
        },
    },
});