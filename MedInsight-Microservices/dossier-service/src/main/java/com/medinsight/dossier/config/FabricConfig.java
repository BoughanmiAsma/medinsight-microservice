package com.medinsight.dossier.config;

import org.hyperledger.fabric.gateway.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Lazy;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.InvalidKeyException;
import java.security.PrivateKey;
import java.security.cert.CertificateException;
import java.security.cert.X509Certificate;

@Configuration
@ConditionalOnProperty(name = "fabric.enabled", havingValue = "true", matchIfMissing = false)
public class FabricConfig {

    private static final Logger logger = LoggerFactory.getLogger(FabricConfig.class);

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
    @Lazy
    public Wallet wallet() throws IOException, InvalidKeyException, CertificateException {
        logger.info("Initializing Fabric wallet at: {}", walletPath);
        // Create a new file system wallet at the specified path
        Path walletDirectory = Paths.get(walletPath);
        Wallet wallet = Wallets.newFileSystemWallet(walletDirectory);

        // Check if the identity already exists in the wallet
        if (wallet.get(userName) == null) {
            logger.info("Identity {} not found in wallet, creating new identity", userName);
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
            logger.info("Identity {} successfully created and stored in wallet", userName);
        } else {
            logger.info("Identity {} already exists in wallet", userName);
        }

        return wallet;
    }

    @Bean
    @Lazy
    public Gateway gateway(Wallet wallet) throws IOException {
        logger.info("Connecting to Fabric network using connection profile: {}", connectionProfile);
        Path networkConfigPath = Paths.get(connectionProfile);

        Gateway.Builder builder = Gateway.createBuilder();
        builder.identity(wallet, userName)
                .networkConfig(networkConfigPath)
                .discovery(false);

        Gateway gateway = builder.connect();
        logger.info("Successfully connected to Fabric network");
        return gateway;
    }

    @Bean
    @Lazy
    public Network network(Gateway gateway) {
        logger.info("Getting network: {}", channelName);
        return gateway.getNetwork(channelName);
    }

    @Bean
    @Lazy
    public Contract contract(Network network) {
        logger.info("Getting contract: {}", contractName);
        return network.getContract(contractName);
    }
}
