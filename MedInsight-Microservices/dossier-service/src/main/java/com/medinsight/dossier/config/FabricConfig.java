package com.medinsight.dossier.config;

import org.hyperledger.fabric.gateway.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.InvalidKeyException;
import java.security.PrivateKey;
import java.security.cert.CertificateException;
import java.security.cert.X509Certificate;

@Configuration
public class FabricConfig {

    @Value("${fabric.walletPath}")
    private String walletPath;

    @Value("${fabric.connectionProfile}")
    private String connectionProfile;

    @Value("${fabric.userName}")
    private String userName;

    @Value("${fabric.channelName}")
    private String channelName;

    @Value("${fabric.contractName}")
    private String contractName;

    @Value("${fabric.mspId}")
    private String mspId;

    @Value("${fabric.certPath}")
    private String certPath;

    @Value("${fabric.keyPath}")
    private String keyPath;

    @Bean
    public Wallet wallet() throws IOException, InvalidKeyException, CertificateException {
        // Create a new file system wallet at the specified path
        Path walletDirectory = Paths.get(walletPath);
        Wallet wallet = Wallets.newFileSystemWallet(walletDirectory);

        // Check if the identity already exists in the wallet
        if (wallet.get(userName) == null) {
            // Load certificate from the fabric-ca-client generated files
            X509Certificate certificate = Identities.readX509Certificate(
                    Files.newBufferedReader(Paths.get(certPath)));

            // Load private key
            PrivateKey privateKey = Identities.readPrivateKey(
                    Files.newBufferedReader(Paths.get(keyPath)));

            // Create identity
            Identity identity = Identities.newX509Identity(mspId, certificate, privateKey);

            // Put identity in wallet
            wallet.put(userName, identity);
        }

        return wallet;
    }

    @Bean
    public Gateway gateway(Wallet wallet) throws IOException {
        Path networkConfigPath = Paths.get(connectionProfile);

        Gateway.Builder builder = Gateway.createBuilder();
        builder.identity(wallet, userName)
                .networkConfig(networkConfigPath)
                .discovery(false);

        return builder.connect();
    }

    @Bean
    public Network network(Gateway gateway) {
        return gateway.getNetwork(channelName);
    }

    @Bean
    public Contract contract(Network network) {
        return network.getContract(contractName);
    }
}
