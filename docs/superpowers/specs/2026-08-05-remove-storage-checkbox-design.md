# Remove Storage Checkbox

## Goal

Remove the explicit storage acknowledgement checkbox from the report identity form without breaking report submission, existing drafts, or the PHP persistence contract.

## Scope

- Keep name and email required.
- Remove the checkbox, its validation error, and its UI copy.
- Treat clicking "Salvar e ver relatorio" as the action that allows the existing submission flow to continue.
- Continue emitting `storageAcknowledged: true` in the immutable report snapshot for backward compatibility.
- Leave the PHP endpoint and persisted JSON schema unchanged.
- Do not alter or delete any existing report files.

## Data Flow

The identity form validates only name and email. After validation, normalization supplies the legacy `storageAcknowledged: true` value. The resulting snapshot follows the existing local-draft and PHP submission path unchanged.

Existing version 2 drafts remain valid because their snapshots already contain the required compatibility field. The PHP endpoint continues requiring the field, preventing a frontend-only deployment from creating an incompatible payload.

## Error Handling

Name, email, local-storage, network, server, retry, and conflict behavior remain unchanged. There is no longer a checkbox-specific validation state or translated error.

## Testing

- Participant validation succeeds with a valid name and email without a checkbox input.
- Participant normalization still adds `storageAcknowledged: true`.
- The identity form contains no storage checkbox or agreement text.
- PHP integration tests continue proving that the compatibility field is required server-side.
- The full test and production build commands must pass before deployment.

## Deployment Safety

Deploy through the existing workflow. The persistent report directory is outside the replaced application directory and remains protected by the existing writable-mount guard. Verify the production page no longer contains the acknowledgement copy and confirm the saved report count is unchanged immediately after deployment.
