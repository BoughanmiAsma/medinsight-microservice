package main

import (
	"encoding/json"
	"fmt"
	"time"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

// MedicalRecordsContract provides functions for managing medical records
type MedicalRecordsContract struct {
	contractapi.Contract
}

// MedicalRecord represents a patient's medical record
type MedicalRecord struct {
	RecordID    string    `json:"recordId"`
	PatientID   string    `json:"patientId"`
	DoctorID    string    `json:"doctorId"`
	Diagnosis   string    `json:"diagnosis"`
	Treatment   string    `json:"treatment"`
	Medications []string  `json:"medications"`
	LabResults  string    `json:"labResults"`
	Notes       string    `json:"notes"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
	CreatedBy   string    `json:"createdBy"` // MSP ID of creator
}

// CreateRecord creates a new medical record
func (c *MedicalRecordsContract) CreateRecord(ctx contractapi.TransactionContextInterface, recordID string, patientID string, doctorID string, diagnosis string, treatment string, medications string, labResults string, notes string) error {
	// Get the MSP ID of the submitter
	mspID, err := ctx.GetClientIdentity().GetMSPID()
	if err != nil {
		return fmt.Errorf("failed to get MSP ID: %v", err)
	}

	// Only DoctorOrg can create records
	if mspID != "DoctorOrgMSP" {
		return fmt.Errorf("only doctors can create medical records")
	}

	// Check if record already exists
	existing, err := ctx.GetStub().GetState(recordID)
	if err != nil {
		return fmt.Errorf("failed to read from world state: %v", err)
	}
	if existing != nil {
		return fmt.Errorf("record %s already exists", recordID)
	}

	// Parse medications JSON array
	var meds []string
	if medications != "" {
		err = json.Unmarshal([]byte(medications), &meds)
		if err != nil {
			return fmt.Errorf("failed to parse medications: %v", err)
		}
	}

	record := MedicalRecord{
		RecordID:    recordID,
		PatientID:   patientID,
		DoctorID:    doctorID,
		Diagnosis:   diagnosis,
		Treatment:   treatment,
		Medications: meds,
		LabResults:  labResults,
		Notes:       notes,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
		CreatedBy:   mspID,
	}

	recordJSON, err := json.Marshal(record)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(recordID, recordJSON)
}

// ReadRecord retrieves a medical record
func (c *MedicalRecordsContract) ReadRecord(ctx contractapi.TransactionContextInterface, recordID string) (*MedicalRecord, error) {
	recordJSON, err := ctx.GetStub().GetState(recordID)
	if err != nil {
		return nil, fmt.Errorf("failed to read from world state: %v", err)
	}
	if recordJSON == nil {
		return nil, fmt.Errorf("record %s does not exist", recordID)
	}

	var record MedicalRecord
	err = json.Unmarshal(recordJSON, &record)
	if err != nil {
		return nil, err
	}

	return &record, nil
}

// UpdateRecord updates an existing medical record
func (c *MedicalRecordsContract) UpdateRecord(ctx contractapi.TransactionContextInterface, recordID string, diagnosis string, treatment string, medications string, labResults string, notes string) error {
	// Get the MSP ID of the submitter
	mspID, err := ctx.GetClientIdentity().GetMSPID()
	if err != nil {
		return fmt.Errorf("failed to get MSP ID: %v", err)
	}

	// Only DoctorOrg can update records
	if mspID != "DoctorOrgMSP" {
		return fmt.Errorf("only doctors can update medical records")
	}

	record, err := c.ReadRecord(ctx, recordID)
	if err != nil {
		return err
	}

	// Update fields
	if diagnosis != "" {
		record.Diagnosis = diagnosis
	}
	if treatment != "" {
		record.Treatment = treatment
	}
	if medications != "" {
		var meds []string
		err = json.Unmarshal([]byte(medications), &meds)
		if err != nil {
			return fmt.Errorf("failed to parse medications: %v", err)
		}
		record.Medications = meds
	}
	if labResults != "" {
		record.LabResults = labResults
	}
	if notes != "" {
		record.Notes = notes
	}
	record.UpdatedAt = time.Now()

	recordJSON, err := json.Marshal(record)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(recordID, recordJSON)
}

// DeleteRecord deletes a medical record
func (c *MedicalRecordsContract) DeleteRecord(ctx contractapi.TransactionContextInterface, recordID string) error {
	// Get the MSP ID of the submitter
	mspID, err := ctx.GetClientIdentity().GetMSPID()
	if err != nil {
		return fmt.Errorf("failed to get MSP ID: %v", err)
	}

	// Only DoctorOrg or PatientOrg can delete records
	if mspID != "DoctorOrgMSP" && mspID != "PatientOrgMSP" {
		return fmt.Errorf("only doctors or patients can delete medical records")
	}

	exists, err := ctx.GetStub().GetState(recordID)
	if err != nil {
		return fmt.Errorf("failed to read from world state: %v", err)
	}
	if exists == nil {
		return fmt.Errorf("record %s does not exist", recordID)
	}

	return ctx.GetStub().DelState(recordID)
}

// QueryRecordsByPatient retrieves all records for a specific patient
func (c *MedicalRecordsContract) QueryRecordsByPatient(ctx contractapi.TransactionContextInterface, patientID string) ([]*MedicalRecord, error) {
	queryString := fmt.Sprintf(`{"selector":{"patientId":"%s"}}`, patientID)

	resultsIterator, err := ctx.GetStub().GetQueryResult(queryString)
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	var records []*MedicalRecord
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}

		var record MedicalRecord
		err = json.Unmarshal(queryResponse.Value, &record)
		if err != nil {
			return nil, err
		}
		records = append(records, &record)
	}

	return records, nil
}

// GetAllRecords returns all medical records (for admin purposes)
func (c *MedicalRecordsContract) GetAllRecords(ctx contractapi.TransactionContextInterface) ([]*MedicalRecord, error) {
	resultsIterator, err := ctx.GetStub().GetStateByRange("", "")
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	var records []*MedicalRecord
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}

		var record MedicalRecord
		err = json.Unmarshal(queryResponse.Value, &record)
		if err != nil {
			return nil, err
		}
		records = append(records, &record)
	}

	return records, nil
}

func main() {
	chaincode, err := contractapi.NewChaincode(&MedicalRecordsContract{})
	if err != nil {
		fmt.Printf("Error creating medical records chaincode: %v\n", err)
		return
	}

	if err := chaincode.Start(); err != nil {
		fmt.Printf("Error starting medical records chaincode: %v\n", err)
	}
}
