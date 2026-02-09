# Database Relationships Analysis

Based on the Prisma schema introspected from `compliance_db`, here are the logical relationships identified. Note that formal Foreign Key constraints are not defined in the SQL level, so these are handled at the application logic or as virtual relations in Prisma.

## 1. Document Management
- **`categories_form` ↔ `categories_master`**
  - **Link**: `cat_folder`
  - **Description**: Each compliance document (`categories_form`) belongs to a category defined in `categories_master` via the folder name/code.

- **`categories_form` ↔ `status_master`**
  - **Link**: `status` (form) ↔ `code_id` or `name` (status_master)
  - **Description**: Defines the current state of a compliance document (e.g., Pending, Active, Expired).

## 2. User & Access Control
- **`users` ↔ `users_factory`**
  - **Link**: `users_factory.user_id` ↔ `users.id`
  - **Note**: There is a type mismatch (`Int` vs `BigInt`), suggesting `users_factory` might be using truncated IDs or is from an older schema version.
  - **Description**: Maps users to specific factories they are responsible for.

- **`users` ↔ `categories_master`**
  - **Link**: `users.cat_id` ↔ `categories_master.id`
  - **Note**: `cat_id` is stored as a String (VarChar 250), which might support multiple category IDs separated by commas.
  - **Description**: Controls which categories a user has permission to access.

## 3. Document Attribution
- **`categories_form` ↔ `users`**
  - **Link**:
    - `responsible_person`
    - `document_preparer`
    - `document_receive`
  - **Description**: These fields in the document form point to users by their name or ID.

## Recommended Prisma Model Improvements (Virtual Relations)
To use Prisma's `include` feature, you can add these virtual relations to your `schema.prisma` without migrating the database:

```prisma
// Example for users_factory
model users_factory {
  id           Int       @id @default(autoincrement())
  user_id      Int?
  // user         users?    @relation(fields: [user_id], references: [id]) 
  // (Requires fixing the type mismatch first or using a manual query)
  ...
}
```
