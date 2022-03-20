@cloud-catalog
@cc-3
@cc
@DBbootstrap=cloudcatalog
@runTimes=200

Feature: Update Chosen Offerings via Cloud Catalog API 

    Scenario: PATCH Offering using ProductOfferingController (Granular)
        Given the parameters related with scenario "PATCH-PROD-OFFER-3.2"
        And set up offer id: @offer_id
        When call Cloud Integration API with defined params
        Then the Cloud Integration API response status should be "200"
        And the Cloud Integration API response should match with "RULES-3.2"