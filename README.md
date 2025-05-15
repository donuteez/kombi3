# Auto Repair Shop Management Application

This application provides auto repair technicians with a comprehensive system to record, store, and review vehicle repair information.

## Features

- **Repair Sheet Submission**: Create new repair sheets with technician information, RO numbers, measurements, and recommendations
- **File Management**: Upload and view diagnostic text files directly in the browser
- **Searchable History**: View and search through previously submitted repair records
- **Detailed Views**: Examine comprehensive repair details including tire and brake measurements
- **Real-time Updates**: See new submissions instantly without refreshing

## Setup Instructions

1. **Create a Supabase Project**:
   - Sign up or log in at [https://supabase.com](https://supabase.com)
   - Create a new project
   - Get your project URL and anon key from the API settings

2. **Configure the Application**:
   - Open `index.html` and replace the placeholder values:
     ```js
     const supabaseUrl = 'YOUR_SUPABASE_URL';
     const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY';
     ```

3. **Set Up the Database**:
   - Run the SQL from `supabase/migrations/create_tables.sql` in the Supabase SQL Editor
   - This will create the necessary tables and storage buckets

4. **Storage Setup**:
   - Ensure you have a storage bucket named `diagnostic-files` in your Supabase project
   - Set appropriate public access permissions for this bucket

## Technologies Used

- React (loaded from CDN) for the user interface
- Supabase for database and storage
- Tailwind CSS for styling
- Babel for JSX transpilation

## Security Notes

- This application uses anonymous access to Supabase
- For production use, consider implementing proper authentication and row-level security