@init

Feature: Init Test 0

    Scenario: Math 01
        Given A is 5
        And B is 5
        When A + B
        Then Result should be 10

    Scenario: Math 02
        Given A is 5
        And B is 3
        When A + B
        Then Result should be 9