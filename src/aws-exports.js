// src/aws-exports.js
const awsmobile = {
    "aws_project_region": "ap-south-1", // e.g., 'us-east-1', 'ap-south-1'
    "aws_cognito_region": "ap-south-1", // Should be the same as aws_project_region
    "aws_user_pools_id": "ap-south-1_RB7gb2oFy", // e.g., 'us-east-1_XXXXX'
    "aws_user_pools_web_client_id": "pqvqbiq9uiuulqusq56arrcr8", // e.g., 'XXXXXXXXXXXXXXXXXXXXXXX'
    "oauth": {}, // Keep this empty for now unless you set up OAuth providers
    "aws_cognito_username_attributes": [
        "EMAIL" // Specifies that users sign in with their email
    ],
    "aws_cognito_signup_attributes": [
        "EMAIL" // Specifies which attributes are required during signup
        // You can add "NAME" here if you configured it as a required attribute in Cognito
    ],
    "aws_cognito_mfa_configuration": "OFF", // Matches your Cognito settings
    "aws_cognito_password_protection_settings": {
        "passwordPolicyMinLength": 8, // Adjust to match your Cognito User Pool password policy
        "passwordPolicyCharacters": [] // Add character requirements if your policy dictates (e.g., ["REQUIRES_LOWERCASE", "REQUIRES_NUMBERS"])
    },
    "aws_cognito_verification_mechanisms": [
        "EMAIL" // Matches your Cognito settings for verification
    ]
};

export default awsmobile;
