package main

import (
	"encoding/json"
	"fmt"
	"time"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

// PrescriptionsContract provides functions for managing prescriptions
type PrescriptionsContract struct {
	contractapi.Contract
}

// Prescription represents a medical prescription
type Prescription struct {
	PrescriptionID string    `json:"prescriptionId"`
	PatientID      string    `json:"patientId"`
	DoctorID       string    `json:"doctorId"`
	PharmacyID     string    `json:"pharmacyId,omitempty"`
	Medications    []Medication `json:"medications"`
	Instructions   string    `json:"instructions"`
	IssuedAt       time.Time `json:"issuedAt"`
	ExpiresAt      time.Time `json:"expiresAt"`
	DispensedAt    *time.Time `json:"dispensedAt,omitempty"`
	IsDispensed    bool      `json:"isDispensed"`
	CreatedBy      string    `json:"createdBy"` // MSP ID
}

// Medication represents a single medication in a prescription
type Medication struct {
	Name        string `json:"name"`
	Dosage      string `json:"dosage"`
	Frequency   string `json:"frequency"`
	Duration    string `json:"duration"`
	Quantity    int    `json:"quantity"`
}

// CreatePrescription allows a doctor to create a new prescription
func (c *PrescriptionsContract) CreatePrescription(ctx contractapi.TransactionContextInterface, prescriptionID string, patientID string, doctorID string, medicationsJSON string, instructions string, expiresInDays int) error {
	// Get the MSP ID of the submitter
	mspID, err := ctx.GetClientIdentity().GetMSPID()
	if err != nil {
		return fmt.Errorf("failed to get MSP ID: %v", err)
	}

	// Only DoctorOrg can create prescriptions
	if mspID != "DoctorOrgMSP" {
		return fmt.Errorf("only doctors can create prescriptions")
	}

	// Check if prescription already exists
	existing, err := ctx.GetStub().GetState(prescriptionID)
	if err != nil {
		return fmt.Errorf("failed to read from world state: %v", err)
	}
	if existing != nil {
		return fmt.Errorf("prescription %s already exists", prescriptionID)
	}

	// Parse medications
	var medications []Medication
	err = json.Unmarshal([]byte(medicationsJSON), &medications)
	if err != nil {
		return fmt.Errorf("failed to parse medications: %v", err)
	}

	expiresAt := time.Now().AddDate(0, 0, expiresInDays)

	prescription := Prescription{
		PrescriptionID: prescriptionID,
		PatientID:      patientID,
		DoctorID:       doctorID,
		Medications:    medications,
		Instructions:   instructions,
		IssuedAt:       time.Now(),
		ExpiresAt:      expiresAt,
		DispensedAt:    nil,
		IsDispensed:    false,
		CreatedBy:      mspID,
	}

	prescriptionJSON, err := json.Marshal(prescription)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(prescriptionID, prescriptionJSON)
}

// ReadPrescription retrieves a prescription
func (c *PrescriptionsContract) ReadPrescription(ctx contractapi.TransactionContextInterface, prescriptionID string) (*Prescription, error) {
	prescriptionJSON, err := ctx.GetStub().GetState(prescriptionID)
	if err != nil {
		return nil, fmt.Errorf("failed to read from world state: %v", err)
	}
	if prescriptionJSON == nil {
		return nil, fmt.Errorf("prescription %s does not exist", prescriptionID)
	}

	var prescription Prescription
	err = json.Unmarshal(prescriptionJSON, &prescription)
	if err != nil {
		return nil, err
	}

	return &prescription, nil
}

// DispensePrescription allows a pharmacy to mark a prescription as dispensed
func (c *PrescriptionsContract) DispensePrescription(ctx contractapi.TransactionContextInterface, prescriptionID string, pharmacyID string) error {
	// Get the MSP ID of the submitter
	mspID, err := ctx.GetClientIdentity().GetMSPID()
	if err != nil {
		return fmt.Errorf("failed to get MSP ID: %v", err)
	}

	// Only PharmacyOrg can dispense prescriptions
	if mspID != "PharmacyOrgMSP" {
		return fmt.Errorf("only pharmacies can dispense prescriptions")
	}

	prescriptionJSON, err := ctx.GetStub().GetState(prescriptionID)
	if err != nil {
		return fmt.Errorf("failed to read from world state: %v", err)
	}
	if prescriptionJSON == nil {
		return fmt.Errorf("prescription %s does not exist", prescriptionID)
	}

	var prescription Prescription
	err = json.Unmarshal(prescriptionJSON, &prescription)
	if err != nil {
		return err
	}

	// Check if already dispensed
	if prescription.IsDispensed {
		return fmt.Errorf("prescription has already been dispensed")
	}

	// Check if expired
	if time.Now().After(prescription.ExpiresAt) {
		return fmt.Errorf("prescription has expired")
	}

	// Mark as dispensed
	now := time.Now()
	prescription.DispensedAt = &now
	prescription.IsDispensed = true
	prescription.PharmacyID = pharmacyID

	updatedPrescriptionJSON, err := json.Marshal(prescription)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(prescriptionID, updatedPrescriptionJSON)
}

// QueryPrescriptionsByPatient retrieves all prescriptions for a specific patient
func (c *PrescriptionsContract) QueryPrescriptionsByPatient(ctx contractapi.TransactionContextInterface, patientID string) ([]*Prescription, error) {
	queryString := fmt.Sprintf(`{"selector":{"patientId":"%s"}}`, patientID)

	resultsIterator, err := ctx.GetStub().GetQueryResult(queryString)
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	var prescriptions []*Prescription
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}

		var prescription Prescription
		err = json.Unmarshal(queryResponse.Value, &prescription)
		if err != nil {
			return nil, err
		}
		prescriptions = append(prescriptions, &prescription)
	}

	return prescriptions, nil
}

// QueryPrescriptionsByDoctor retrieves all prescriptions created by a specific doctor
func (c *PrescriptionsContract) QueryPrescriptionsByDoctor(ctx contractapi.TransactionContextInterface, doctorID string) ([]*Prescription, error) {
	queryString := fmt.Sprintf(`{"selector":{"doctorId":"%s"}}`, doctorID)

	resultsIterator, err := ctx.GetStub().GetQueryResult(queryString)
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	var prescriptions []*Prescription
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}

		var prescription Prescription
		err = json.Unmarshal(queryResponse.Value, &prescription)
		if err != nil {
			return nil, err
		}
		prescriptions = append(prescriptions, &prescription)
	}

	return prescriptions, nil
}

// QueryActivePrescriptionsByPatient retrieves all active (non-dispensed, non-expired) prescriptions for a patient
func (c *PrescriptionsContract) QueryActivePrescriptionsByPatient(ctx contractapi.TransactionContextInterface, patientID string) ([]*Prescription, error) {
	queryString := fmt.Sprintf(`{"selector":{"patientId":"%s","isDispensed":false}}`, patientID)

	resultsIterator, err := ctx.GetStub().GetQueryResult(queryString)
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	var prescriptions []*Prescription
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}

		var prescription Prescription
		err = json.Unmarshal(queryResponse.Value, &prescription)
		if err != nil {
			return nil, err
		}

		// Check if not expired
		if time.Now().Before(prescription.ExpiresAt) {
			prescriptions = append(prescriptions, &prescription)
		}
	}

	return prescriptions, nil
}

// GetAllPrescriptions returns all prescriptions (for admin purposes)
func (c *PrescriptionsContract) GetAllPrescriptions(ctx contractapi.TransactionContextInterface) ([]*Prescription, error) {
	resultsIterator, err := ctx.GetStub().GetStateByRange("", "")
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	var prescriptions []*Prescription
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}

		var prescription Prescription
		err = json.Unmarshal(queryResponse.Value, &prescription)
		if err != nil {
			return nil, err
		}
		prescriptions = append(prescriptions, &prescription)
	}

	return prescriptions, nil
}

func main() {
	chaincode, err := contractapi.NewChaincode(&PrescriptionsContract{})
	if err != nil {
		fmt.Printf("Error creating prescriptions chaincode: %v\n", err)
		return
	}

	if err := chaincode.Start(); err != nil {
		fmt.Printf("Error starting prescriptions chaincode: %v\n", err)
	}
}
