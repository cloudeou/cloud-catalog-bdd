@cloud-catalog
@cc-2
@cc
@DBbootstrap=cloud-catalog
@runTimes=1

Feature: Retrieve offerings and store to DB
 
    Scenario: Get all offerings with filters
        Given the parameters related with scenario "GET-PROD-OFFER-2.1"
        When call Cloud Integration API with defined params
        Then the Cloud Integration API response status should be "200"
        And the Cloud Integration API response should match with "RULES-2.1"

    # Scenario: Check if offering are available for update
    #     Given the parameters related with scenario "GET-PROD-OFFER-2.2"
    #     When call Cloud Integration API with defined params
    #     Then the Cloud Integration API response status should be "200"
    #     And the Cloud Integration API response should match with "RULES-2.2"