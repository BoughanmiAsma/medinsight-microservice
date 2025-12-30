package main

import (
	"encoding/json"
	"fmt"
	"time"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

// ConsentContract provides functions for managing patient consent
type ConsentContract struct {
	contractapi.Contract
}

// Consent represents patient consent for data access
type Consent struct {
	ConsentID    string    `json:"consentId"`
	PatientID    string    `json:"patientId"`
	GrantedTo    string    `json:"grantedTo"`    // Doctor or Pharmacy ID
	GrantedToOrg string    `json:"grantedToOrg"` // DoctorOrgMSP or PharmacyOrgMSP
	Purpose      string    `json:"purpose"`
	Scope        string    `json:"scope"`        // What data can be accessed
	ExpiresAt    time.Time `json:"expiresAt"`
	GrantedAt    time.Time `json:"grantedAt"`
	RevokedAt    *time.Time `json:"revokedAt,omitempty"`
	IsActive     bool      `json:"isActive"`
	CreatedBy    string    `json:"createdBy"` // MSP ID
}

// GrantConsent allows a patient to grant consent to a doctor or pharmacy
func (c *ConsentContract) GrantConsent(ctx contractapi.TransactionContextInterface, consentID string, patientID string, grantedTo string, grantedToOrg string, purpose string, scope string, expiresInDays int) error {
	// Get the MSP ID of the submitter
	mspID, err := ctx.GetClientIdentity().GetMSPID()
	if err != nil {
		return fmt.Errorf("failed to get MSP ID: %v", err)
	}

	// Only PatientOrg can grant consent
	if mspID != "PatientOrgMSP" {
		return fmt.Errorf("only patients can grant consent")
	}

	// Validate grantedToOrg
	if grantedToOrg != "DoctorOrgMSP" && grantedToOrg != "PharmacyOrgMSP" {
		return fmt.Errorf("consent can only be granted to DoctorOrg or PharmacyOrg")
	}

	// Check if consent already exists
	existing, err := ctx.GetStub().GetState(consentID)
	if err != nil {
		return fmt.Errorf("failed to read from world state: %v", err)
	}
	if existing != nil {
		return fmt.Errorf("consent %s already exists", consentID)
	}

	expiresAt := time.Now().AddDate(0, 0, expiresInDays)

	consent := Consent{
		ConsentID:    consentID,
		PatientID:    patientID,
		GrantedTo:    grantedTo,
		GrantedToOrg: grantedToOrg,
		Purpose:      purpose,
		Scope:        scope,
		ExpiresAt:    expiresAt,
		GrantedAt:    time.Now(),
		RevokedAt:    nil,
		IsActive:     true,
		CreatedBy:    mspID,
	}

	consentJSON, err := json.Marshal(consent)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(consentID, consentJSON)
}

// RevokeConsent allows a patient to revoke previously granted consent
func (c *ConsentContract) RevokeConsent(ctx contractapi.TransactionContextInterface, consentID string) error {
	// Get the MSP ID of the submitter
	mspID, err := ctx.GetClientIdentity().GetMSPID()
	if err != nil {
		return fmt.Errorf("failed to get MSP ID: %v", err)
	}

	// Only PatientOrg can revoke consent
	if mspID != "PatientOrgMSP" {
		return fmt.Errorf("only patients can revoke consent")
	}

	consentJSON, err := ctx.GetStub().GetState(consentID)
	if err != nil {
		return fmt.Errorf("failed to read from world state: %v", err)
	}
	if consentJSON == nil {
		return fmt.Errorf("consent %s does not exist", consentID)
	}

	var consent Consent
	err = json.Unmarshal(consentJSON, &consent)
	if err != nil {
		return err
	}

	// Mark as revoked
	now := time.Now()
	consent.RevokedAt = &now
	consent.IsActive = false

	updatedConsentJSON, err := json.Marshal(consent)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(consentID, updatedConsentJSON)
}

// CheckConsent verifies if valid consent exists
func (c *ConsentContract) CheckConsent(ctx contractapi.TransactionContextInterface, consentID string) (*Consent, error) {
	consentJSON, err := ctx.GetStub().GetState(consentID)
	if err != nil {
		return nil, fmt.Errorf("failed to read from world state: %v", err)
	}
	if consentJSON == nil {
		return nil, fmt.Errorf("consent %s does not exist", consentID)
	}

	var consent Consent
	err = json.Unmarshal(consentJSON, &consent)
	if err != nil {
		return nil, err
	}

	// Check if consent is still active and not expired
	if !consent.IsActive {
		return nil, fmt.Errorf("consent has been revoked")
	}

	if time.Now().After(consent.ExpiresAt) {
		return nil, fmt.Errorf("consent has expired")
	}

	return &consent, nil
}

// QueryConsentsByPatient retrieves all consents for a specific patient
func (c *ConsentContract) QueryConsentsByPatient(ctx contractapi.TransactionContextInterface, patientID string) ([]*Consent, error) {
	queryString := fmt.Sprintf(`{"selector":{"patientId":"%s"}}`, patientID)

	resultsIterator, err := ctx.GetStub().GetQueryResult(queryString)
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	var consents []*Consent
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}

		var consent Consent
		err = json.Unmarshal(queryResponse.Value, &consent)
		if err != nil {
			return nil, err
		}
		consents = append(consents, &consent)
	}

	return consents, nil
}

// QueryActiveConsentsByPatient retrieves all active consents for a specific patient
func (c *ConsentContract) QueryActiveConsentsByPatient(ctx contractapi.TransactionContextInterface, patientID string) ([]*Consent, error) {
	queryString := fmt.Sprintf(`{"selector":{"patientId":"%s","isActive":true}}`, patientID)

	resultsIterator, err := ctx.GetStub().GetQueryResult(queryString)
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	var consents []*Consent
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}

		var consent Consent
		err = json.Unmarshal(queryResponse.Value, &consent)
		if err != nil {
			return nil, err
		}

		// Double-check expiration
		if time.Now().Before(consent.ExpiresAt) {
			consents = append(consents, &consent)
		}
	}

	return consents, nil
}

// GetAllConsents returns all consents (for admin purposes)
func (c *ConsentContract) GetAllConsents(ctx contractapi.TransactionContextInterface) ([]*Consent, error) {
	resultsIterator, err := ctx.GetStub().GetStateByRange("", "")
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	var consents []*Consent
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}

		var consent Consent
		err = json.Unmarshal(queryResponse.Value, &consent)
		if err != nil {
			return nil, err
		}
		consents = append(consents, &consent)
	}

	return consents, nil
}

func main() {
	chaincode, err := contractapi.NewChaincode(&ConsentContract{})
	if err != nil {
		fmt.Printf("Error creating consent chaincode: %v\n", err)
		return
	}

	if err := chaincode.Start(); err != nil {
		fmt.Printf("Error starting consent chaincode: %v\n", err)
	}
}
