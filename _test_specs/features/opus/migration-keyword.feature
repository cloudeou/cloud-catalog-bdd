@-
@-
@opus
@DBbootstrap=opusbootstrap
@runTimes=1

Feature: Activate account in AVS for existing customers

    Scenario: Set pre-conditions for migration
        Given check no error occured
        And set customer ECID: @ecid
        And set customer location id: @location_id
        And set customer IPTV CFS instance id: @iptv_id

    Scenario: Check if all BPIs are active under customer location
        Given check no error occured
        When User try to get product instance
        Then response should not contain the next offering
        | Offer Id            |
        | 9155276198813277660 |
        # change validation 

    Scenario: Submit Empty Modify IPTV CFS Order
        Given check no error occured
        When user try to submit order via OSS/J API
        Then validate order is submitted successfully

    Scenario: Check backend orders validation
        Given check no error occured
        # When try to complete order on BE
        # Then validate that no errors created on BE
        And validate that all orders are completed successfully
        # migrated -> true

    Scenario: finish migration
        When write error if occured for opus_migration
        Then reset customer migrating flag
        # migrating -> false
        And check customer migration went successfuly
        # close