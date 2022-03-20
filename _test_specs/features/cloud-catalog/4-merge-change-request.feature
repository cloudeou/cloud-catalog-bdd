@cloud-catalog
@cc-4
@cc

Feature: Merge CR via API Cloud Catalog

    Scenario: Merge CR via API Cloud Catalog
        Given the parameters related with scenario "POST-MERGE-CR-4.1"
        When call Cloud Integration API with defined params
        Then the Cloud Integration API response status should be "200"
        And the Cloud Integration API response should match with "RULES-4.1"