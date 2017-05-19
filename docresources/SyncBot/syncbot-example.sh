#!/usr/bin/env bash

# Rebuild the transpiled code
clear
npm install
rm -rf ./build
gulp build

# Select which bots to boot
export PROCBOT_BOTS_TO_LOAD="syncbot"

export SYNCBOT_MAPPINGS="[
    [
        { \"service\": \"blah\", \"flow\": \"blah\" },
        { \"service\": \"blah\", \"flow\": \"blah\" },
        { \"service\": \"blah\", \"flow\": \"blah\" }
    ]
]"
# Service to use to access details provided by the user
export SYNCBOT_HUB_SERVICE="blah"
# Accounts to use as substitutes when no configured account is found
export SYNCBOT_GENERIC_AUTHOR_ACCOUNTS="{
    \"blah\": {
        \"user\": \"...\",
        \"token\": \"...\"
    }
}"
# Accounts to use to report system messages
export SYNCBOT_SYSTEM_MESSAGE_ACCOUNTS="{
    \"blah\": {
        \"user\": \"...\",
        \"token\": \"...\"
    },
    \"blah\": {
        \"user\": \"...\",
        \"token\": \"...\"
    }
}"

# Details for the Discourse adapter
export DISCOURSE_LISTENER_ACCOUNT_API_TOKEN="..."
export DISCOURSE_LISTENER_ACCOUNT_USERNAME="..."
export DISCOURSE_INSTANCE_URL="..."

# Details for the Flowdock adapter
export FLOWDOCK_ORGANIZATION_NAME="..."
export FLOWDOCK_LISTENER_ACCOUNT_API_TOKEN="..."

# Details for the Front adapter
export FRONT_LISTENER_ACCOUNT_API_TOKEN="..."
export FRONT_INBOX_CHANNELS="{
    \"inb_blah\": \"cha_blah\"
}"

# Details for the Message Converter hub
export MESSAGE_CONVERTOR_PRIVATE_INDICATORS="[\"💭\"]"
export MESSAGE_CONVERTOR_PUBLIC_INDICATORS="[\"💬\", \"%\"]"

# Do the thing
npm start
