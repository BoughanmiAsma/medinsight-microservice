package com.medinsight.dossier.config;

import org.hyperledger.fabric.gateway.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.InvalidKeyException;
import java.security.cert.CertificateException;

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

    @Bean
    public Wallet wallet() throws IOException {
        return Wallets.newFileSystemWallet(Paths.get(walletPath));
    }

    @Bean
    public Gateway gateway(Wallet wallet) throws IOException {
        Path networkConfigPath = Paths.get(connectionProfile);
        
        Gateway.Builder builder = Gateway.createBuilder();
        builder.identity(wallet, userName).networkConfig(networkConfigPath).discovery(true);

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
