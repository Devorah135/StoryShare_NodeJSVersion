# Story Share for Educators  

## Overview  
Story Share is a **Node.js-based** platform where educators can submit and browse stories categorized by **topic and grade level** to enhance their lesson plans.  

## Features  
- **Story Submission**: Teachers can submit stories without logging in.  
- **Admin Moderation**: Admins log in to approve or delete submissions.  
- **Categorization**: Stories are organized by topic and grade level for easy browsing.  
- **Interactive UI**: Uses jQuery for user interactions.  
- **Secure Authentication**: Admin login using JWT.  

## Technologies Used  
- **Frontend**: HTML, CSS, jQuery  
- **Backend**: Node.js (Express.js)  
- **Database**: MongoDB  
- **Authentication**: JWT (JSON Web Token)  

## Setup  
1. Clone the repository.  
2. Install dependencies:  
   ```sh
   npm install
   ```  
3. Set up a `.env` file with the following variables:  
   ```env
   MONGO_URI=<your-mongodb-uri>
   JWT_SECRET=<your-secret-key>
   PORT=3000
   ```  
4. Start the server:  
   ```sh
   npm start
   ```  
5. Access the app at `http://localhost:3000`  

## Future Improvements  
- User accounts for teachers  
- Story rating and comments  
- Search and filter options  
