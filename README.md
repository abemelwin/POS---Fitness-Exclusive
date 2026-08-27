# POS - Fitness Exclusive

A browser-based point-of-sale and inventory management system for the Fitness Exclusive Trium Pasay branch. The application uses Firebase Cloud Firestore for real-time data storage and synchronization.

## Features

- Dashboard with total sales, collections, outstanding balances, and inventory on hand
- New sales with automatic amount computation and invoice generation
- Stock receiving with supplier and reference details
- Automatic paid-sale entries in Collections history
- Filterable collections history
- Inventory tracking with low-stock status
- Sales history with filtering and editing support
- Collections and stock-in history
- Settings for managing items, prices, staff, payment types, branch, and reorder level
- Responsive layout for desktop and mobile browsers

## Technology

- HTML5
- CSS3
- Vanilla JavaScript
- Firebase 10.12.0 JavaScript SDK
- Cloud Firestore
- Google Fonts and Material Icons

## Project Structure

```text
.
|-- index.html           # Application interface
|-- styles.css           # Application styles
|-- app.js               # Navigation, calculations, and Firestore operations
|-- firebase-config.js   # Firebase project configuration
|-- SETUP.md             # Additional setup notes
`-- README.md            # Project documentation
```

## Requirements

- A Firebase project with Cloud Firestore enabled
- A modern web browser
- Internet access
- Firebase CLI, only if deploying with Firebase Hosting

## Firebase Setup

1. Create a project in the [Firebase Console](https://console.firebase.google.com/).
2. Create a Cloud Firestore database. Use a region close to your users, such as `asia-southeast1`.
3. Register a Web App in **Project settings > Your apps**.
4. Copy the generated Firebase configuration into `firebase-config.js`.
5. Confirm that the configuration points to the intended Firebase project.
6. Open the application through a local web server or deploy it to a hosting provider.

The application creates the `config/settings` document with default items, staff, payment types, branch information, and reorder level when it is run for the first time. The main Firestore collections are:

- `sales`
- `stockIn`
- `collections`
- `inventory`
- `config`

## Run Locally

Because the application loads Firebase and other resources from the web, serve the project through a local HTTP server instead of opening `index.html` directly.

For example, with Python installed:

```bash
python -m http.server 8000
```

Then open [http://localhost:8000](http://localhost:8000) in your browser.

## Deploy with Firebase Hosting

Install and authenticate the Firebase CLI:

```bash
npm install -g firebase-tools
firebase login
```

From the project directory, initialize Hosting and select the existing Firebase project:

```bash
firebase init hosting
```

Recommended choices:

- Public directory: `.`
- Configure as a single-page app: `No`
- Overwrite `index.html`: `No`

Deploy the application:

```bash
firebase deploy --only hosting
```

Firebase will display the hosted URL after deployment.

## Security Notice

Do not use open Firestore rules in production. Anyone who can access the application can potentially read or modify data if the database rules allow public access. Before using this system with real business data:

- Configure authenticated staff access with Firebase Authentication.
- Restrict Firestore reads and writes to authorized users.
- Validate permissions and document ownership in Firestore Security Rules.
- Review and test the rules in the Firebase Console.
- Keep backups of important data.

The Firebase web configuration is expected to be present in a client-side application, but it does not replace Firestore Security Rules or user authentication.

## Usage Notes

- Use **Settings** to configure the items, prices, staff, payment types, branch, and reorder level.
- Record stock before creating sales so inventory quantities are accurate.
- Use the **Collections** page to review paid-sale history and filter records by date, customer, invoice, or status.
- The dashboard and inventory status update from Firestore in real time.
