@cloud-catalog
@cc-1
@cc

Feature: Create CR via API Cloud Catalog
 
    Scenario: Create CR via API Cloud Catalog
        Given the parameters related with scenario "POST-CREATE-CR-1.1"
        When call Cloud Integration API with defined params
        Then the Cloud Integration API response status should be "200"
        And the Cloud Integration API response should match with "RULES-1.1"