#!/bin/bash
peer chaincode query -C recordschannel -n medical-records -c '{"Args":["GetAllRecords"]}'
