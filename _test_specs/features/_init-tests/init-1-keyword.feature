@init

Feature: Init Test 1

    Scenario: Math 03
        Given A is 7
        And B is 7
        When A + B
        Then Result should be 14

    Scenario: Math 04
        Given A is 6
        And B is 7
        When A + B
        Then Result should be 13

    # Scenario: Math 04 (Should be failed)
    #     Given A is 6
    #     And B is 7
    #     When A + B
    #     Then Result should be 12