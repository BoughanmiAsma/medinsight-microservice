package com.medinsight.staff.exception;

public class ResourceNotFoundException extends RuntimeException {
    // Constructeur 1: Message simple
    public ResourceNotFoundException(String message) {
        super(message);
    }

    // Constructeur 2: Message + cause (erreur originale)
    public ResourceNotFoundException(String message, Throwable cause) {
        super(message, cause); // 'cause' = l'erreur qui a provoqué celle-ci
    }
}
