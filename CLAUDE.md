# AI Coach Codebase Guidelines

## Build Commands
- Angular App: `ng build`, `ng serve`, `ng test`
- Functions: `tsc`, `firebase emulators:start --only auth,firestore,functions,storage`
- Deploy: `firebase deploy`

## Code Style
- Double quotes for strings, not single quotes
- Tab indentation, not spaces
- CRLF line endings
- Max line length: 140 characters
- Strong typing throughout, use explicit typing
- No trailing commas
- Spaces inside curly braces of objects

## Naming Conventions
- Angular components: kebab-case with 'app' prefix
- Services/classes: PascalCase
- Variables/functions: camelCase
- Unused parameters: prefix with underscore

## Error Handling
- Use try/catch blocks with early returns
- Log errors through Firebase Functions logger
- Consistent error pattern with proper error types

## Testing
- Use Angular's TestBed for component tests
- Prefer integration tests over unit tests where appropriate

## Next feature
I'd like you to create a feature for my Angular app for display the user's Serving documents from Frirestore, accessed through the servings.service.ts (getServings()). I'd like to have a servings-list component responsible for displaying a list of serving-item components plus having a "Next day" and "Previous day" buttons at the bottom for querying data from different days (default should be today always). I'd like each Serving item to be displayed in an Expansion panel based on their category (servingCategories from servings.model.ts in shared). The expansion panels should contain a list of Food name, serving name, serving weight of the servings of that category. When clicking on a Serving item, it's default should open in a Modal (add new serving-details component). On this details page I'm interested in the created and alst updated times (formatted in YYYY-MM-dd HH:mm), category, commend of the serving document and it's food's name, brand, category, isApproved (icon), tags, dietaryFlags fields, plus a list of it's nutritions. The food-list and food-item components are similar, you can take those as examples. Add this list to the home component. Please try wrigin easy to read and maintain code, do not use code comments. Use tabs instead of spaces, double quotes and CRLF line endings.
