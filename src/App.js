import React, { useState, useEffect } from 'react';
import { LogIn, User, Calendar, PlusCircle, List, DollarSign, QrCode, Ticket, Users, BarChart, Settings, Home, XCircle, CheckCircle, Upload } from 'lucide-react';
import { Amplify, API, Auth } from 'aws-amplify';
import awsExports from './aws-exports';

// Import your actual Login and Signup components
import LoginPage from './components/LoginPage'; // Assuming you put it in src/components
import SignupPage from './components/SignupPage'; // Assuming you put it in src/components

Amplify.configure(awsExports);

// Main App Component
const App = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentPage, setCurrentPage] = useState('home');
  const [events, setEvents] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [tickets, setTickets] = useState([]);

  // Check current authentication status on app load
  useEffect(() => {
    const checkUser = async () => {
      try {
        const user = await Auth.currentAuthenticatedUser();
        const { signInUserSession } = user;
        // Cognito groups are typically found in the accessToken payload
        const groups = signInUserSession.accessToken.payload["cognito:groups"];
        let role = 'attendee'; // Default role if no specific group
        if (groups && groups.includes('Organizers')) {
          role = 'organizer';
        } else if (groups && groups.includes('Admins')) {
          role = 'admin';
        }
        setCurrentUser({ username: user.username, email: user.attributes.email, role: role });
        // Redirect to dashboard if logged in
        if (role === 'admin') {
          setCurrentPage('admin-dashboard');
        } else {
          setCurrentPage('user-dashboard');
        }
      } catch (error) {
        console.log('No user currently authenticated:', error);
        setCurrentUser(null);
        setCurrentPage('home'); // Go to home if not logged in
      }
    };

    checkUser();
    // Fetch data even if not logged in to populate public sections like event list
    fetchEvents();
    // Only fetch registrations/tickets if a user is logged in (or handle permissions in your API)
    if (currentUser) {
        fetchRegistrations();
        fetchTickets();
    }
  }, [currentUser]); // Dependency array includes currentUser to re-run when user state changes

  // --- Cognito Authentication Functions ---

  const handleLogin = async (email, password) => {
    try {
      const user = await Auth.signIn(email, password);
      const { signInUserSession } = user;
      const groups = signInUserSession.accessToken.payload["cognito:groups"];
      let role = 'attendee';
      if (groups && groups.includes('Organizers')) {
        role = 'organizer';
      } else if (groups && groups.includes('Admins')) {
        role = 'admin';
      }
      setCurrentUser({ username: user.username, email: user.attributes.email, role: role }); // Use user.attributes.email for consistency
      alert('Login successful!');
      if (role === 'admin') {
        setCurrentPage('admin-dashboard');
      } else {
        setCurrentPage('user-dashboard');
      }
      return user; // Return user object for LoginPage to handle success
    } catch (error) {
      console.error('Error logging in:', error);
      throw error; // Re-throw to be caught by the LoginPage component
    }
  };

  const handleSignup = async (email, password, attributes) => {
    try {
      // Cognito uses username for unique identification, often email for user pools
      // `attributes` object should contain additional user attributes like email, custom:role
      const user = await Auth.signUp({
        username: email, // Using email as the username
        password,
        attributes: {
          email, // Standard attribute
          'custom:role': attributes['custom:role'] // Your custom role attribute if defined in Cognito
        },
      });
      console.log('Signup successful, user needs confirmation:', user);
      alert('Verification code sent to your email. Please verify your account.');
      return user; // Return user object for SignupPage to handle showing confirmation form
    } catch (error) {
      console.error('Error signing up:', error);
      throw error;
    }
  };

  // Attach a confirm method to handleSignup for the SignupPage component
  handleSignup.confirm = async (email, code) => {
    try {
      await Auth.confirmSignUp(email, code);
      alert('Account confirmed successfully! You can now log in.');
      setCurrentPage('login'); // Redirect to login after confirmation
    } catch (error) {
      console.error('Error confirming signup:', error);
      throw error;
    }
  };

  const handleSignOut = async () => {
    try {
      await Auth.signOut();
      setCurrentUser(null);
      setCurrentPage('home');
      alert('You have been logged out.');
    } catch (error) {
      console.error('Error signing out:', error);
      alert('Logout failed: ' + error.message);
    }
  };

  // --- DynamoDB Interaction Functions ---

  const listEvents = `
    query ListEvents {
      listEvents {
        items {
          id
          name
          date
          location
          description
          organizerId
          price
        }
      }
    }
  `;

  const listRegistrations = `
    query ListRegistrations {
      listRegistrations {
        items {
          id
          eventId
          userId
          registrationDate
          ticketId
        }
      }
    }
  `;

  const listTickets = `
    query ListTickets {
      listTickets {
        items {
          id
          qrCodeId
          status
          registrationId
        }
      }
    }
  `;

  const createEventMutation = `
    mutation CreateEvent($input: CreateEventInput!) {
      createEvent(input: $input) {
        id
        name
        date
        location
        description
        organizerId
        price
      }
    }
  `;

  const createRegistrationMutation = `
    mutation CreateRegistration($input: CreateRegistrationInput!) {
      createRegistration(input: $input) {
        id
        eventId
        userId
        registrationDate
        ticketId
      }
    }
  `;

  const createTicketMutation = `
    mutation CreateTicket($input: CreateTicketInput!) {
      createTicket(input: $input) {
        id
        qrCodeId
        status
        registrationId
      }
    }
  `;

  const updateTicketMutation = `
    mutation UpdateTicket($input: UpdateTicketInput!) {
      updateTicket(input: $input) {
        id
        status
      }
    }
  `;

  // Function to fetch events
  const fetchEvents = async () => {
    try {
      const eventData = await API.graphql({ query: listEvents });
      setEvents(eventData.data.listEvents.items);
    } catch (error) {
      console.error("Error fetching events:", error);
    }
  };

  // Function to fetch registrations
  const fetchRegistrations = async () => {
    try {
      const registrationData = await API.graphql({ query: listRegistrations });
      setRegistrations(registrationData.data.listRegistrations.items);
    } catch (error) {
      console.error("Error fetching registrations:", error);
    }
  };

  // Function to fetch tickets
  const fetchTickets = async () => {
    try {
      const ticketData = await API.graphql({ query: listTickets });
      setTickets(ticketData.data.listTickets.items);
    } catch (error) {
      console.error("Error fetching tickets:", error);
    }
  };

  // Add Event Function (Now interacts with DynamoDB)
  const handleAddEvent = async (newEvent) => {
    try {
      const result = await API.graphql({
        query: createEventMutation,
        variables: { input: newEvent }
      });
      console.log("Event created:", result.data.createEvent);
      fetchEvents(); // Re-fetch events to update the list
      alert("Event added successfully!");
    } catch (error) {
      console.error("Error creating event:", error);
      alert("Failed to add event: " + error.message);
    }
  };

  // Register for Event Function (Now interacts with DynamoDB)
  const handleRegisterForEvent = async (eventId, userId) => {
    const newRegistration = {
      eventId,
      userId,
      registrationDate: new Date().toISOString(),
      ticketId: null // You might generate this server-side or after ticket creation
    };
    try {
      const result = await API.graphql({
        query: createRegistrationMutation,
        variables: { input: newRegistration }
      });
      console.log("Registration created:", result.data.createRegistration);
      fetchRegistrations(); // Re-fetch registrations
      alert('Successfully registered for the event!');
    } catch (error) {
      console.error("Error registering for event:", error);
      alert("Failed to register: " + error.message);
    }
  };

  // Generate QR Code / Ticket Function (This might be more complex, involving server-side logic to generate unique QR IDs and store in DynamoDB)
  // For now, let's assume `addTicket` is called after a successful registration
  const handleAddTicket = async (registrationId, qrCodeId) => {
    const newTicket = {
      qrCodeId,
      status: "ISSUED",
      registrationId
    };
    try {
      const result = await API.graphql({
        query: createTicketMutation,
        variables: { input: newTicket }
      });
      console.log("Ticket created:", result.data.createTicket);
      fetchTickets(); // Re-fetch tickets
      alert('Ticket generated!');
    } catch (error) {
      console.error("Error generating ticket:", error);
      alert("Failed to generate ticket: " + error.message);
    }
  };

  // Mark Ticket Scanned Function (Interacts with DynamoDB to update ticket status)
  const handleMarkTicketScanned = async (ticketId) => {
    try {
      await API.graphql({
        query: updateTicketMutation,
        variables: { input: { id: ticketId, status: "SCANNED" } }
      });
      fetchTickets(); // Re-fetch tickets to reflect the status change
      alert('Ticket marked as scanned!');
    } catch (error) {
      console.error("Error marking ticket scanned:", error);
      alert("Failed to mark ticket scanned: " + error.message);
    }
  };


  // UI Components (HomeView, AdminDashboard, UserDashboard)
  const HomeView = () => (
    <div className="p-8">
      <h2 className="text-3xl font-bold text-gray-800 mb-6">Welcome to EventFlow</h2>
      {currentUser ? (
        <p className="text-lg text-gray-600 mb-4">You are logged in as {currentUser.username} ({currentUser.role}).</p>
      ) : (
        <p className="text-lg text-gray-600 mb-4">Please log in or sign up to manage your events or register for them.</p>
      )}

      {/* Displaying events fetched from DynamoDB */}
      <h3 className="text-2xl font-semibold text-gray-800 mb-4">Available Events</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.length > 0 ? (
          events.map(event => (
            <div key={event.id} className="bg-white p-6 rounded-xl shadow-md border border-gray-100 flex flex-col justify-between">
              <div>
                <h4 className="text-xl font-bold text-gray-800 mb-2">{event.name}</h4>
                <p className="text-gray-600 text-sm mb-1"><Calendar className="inline-block w-4 h-4 mr-1 text-gray-500" /> {event.date}</p>
                <p className="text-gray-600 text-sm mb-3"><Home className="inline-block w-4 h-4 mr-1 text-gray-500" /> {event.location}</p>
                <p className="text-gray-700 mb-4 text-sm">{event.description}</p>
                <p className="text-green-600 font-semibold text-lg"><DollarSign className="inline-block w-5 h-5 mr-1 text-green-500" /> {event.price ? `$${event.price.toFixed(2)}` : 'Free'}</p>
              </div>
              {currentUser && currentUser.role === 'attendee' && (
                <button
                  onClick={() => handleRegisterForEvent(event.id, currentUser.username)} // Use current user's ID
                  className="mt-4 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition duration-300 ease-in-out flex items-center justify-center text-sm"
                >
                  <Ticket className="w-4 h-4 mr-2" /> Register
                </button>
              )}
            </div>
          ))
        ) : (
          <p className="text-center text-gray-500 col-span-full">No events available at the moment.</p>
        )}
      </div>
    </div>
  );

  const AdminDashboard = () => {
    // Calculate total revenue based on registrations
    const totalRevenue = events.reduce((sum, event) => {
      const eventRegistrations = registrations.filter(reg => reg.eventId === event.id);
      return sum + (event.price || 0) * eventRegistrations.length;
    }, 0);

    const eventsWithRegistrationCount = events.map(event => ({
      ...event,
      registrantCount: registrations.filter(reg => reg.eventId === event.id).length
    }));

    return (
      <div className="p-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-6">Admin Dashboard</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 flex items-center space-x-4">
            <div className="bg-blue-100 p-3 rounded-full">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-3xl font-bold text-gray-900">{events.length}</h3>
              <p className="text-gray-600 text-lg">Total Events</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 flex items-center space-x-4">
            <div className="bg-green-100 p-3 rounded-full">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-3xl font-bold text-gray-900">${totalRevenue.toFixed(2)}</h3>
              <p className="text-gray-600 text-lg">Total Revenue</p>
            </div>
          </div>
        </div>

        <h3 className="text-2xl font-semibold text-gray-800 mb-4">Registrations per Event</h3>
        {eventsWithRegistrationCount.length > 0 ? (
          <div className="bg-gray-50 p-6 rounded-xl shadow-md border border-gray-100 overflow-x-auto">
            <table className="min-w-full bg-white rounded-lg overflow-hidden shadow-sm">
              <thead className="bg-gray-200">
                <tr>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Event Name</th>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Registrants</th>
                </tr>
              </thead>
              <tbody>
                {eventsWithRegistrationCount.map(event => (
                  <tr key={event.id} className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50">
                    <td className="py-3 px-4 text-gray-800">{event.name}</td>
                    <td className="py-3 px-4 text-gray-700">{event.registrantCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center text-gray-500 py-8">No events with registrations yet.</p>
        )}

        {/* Form to Add New Event */}
        <h3 className="text-2xl font-semibold text-gray-800 mb-4 mt-8">Add New Event</h3>
        <form onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.target);
          const newEvent = {
            name: formData.get('eventName'),
            date: formData.get('eventDate'),
            location: formData.get('eventLocation'),
            description: formData.get('eventDescription'),
            price: parseFloat(formData.get('eventPrice')),
            organizerId: currentUser.username // Or actual organizer ID from Cognito
          };
          handleAddEvent(newEvent);
          e.target.reset(); // Clear form
        }} className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
          <div className="mb-4">
            <label htmlFor="eventName" className="block text-gray-700 text-sm font-bold mb-2">Event Name:</label>
            <input type="text" id="eventName" name="eventName" required className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
          </div>
          <div className="mb-4">
            <label htmlFor="eventDate" className="block text-gray-700 text-sm font-bold mb-2">Date:</label>
            <input type="date" id="eventDate" name="eventDate" required className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
          </div>
          <div className="mb-4">
            <label htmlFor="eventLocation" className="block text-gray-700 text-sm font-bold mb-2">Location:</label>
            <input type="text" id="eventLocation" name="eventLocation" required className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
          </div>
          <div className="mb-4">
            <label htmlFor="eventDescription" className="block text-gray-700 text-sm font-bold mb-2">Description:</label>
            <textarea id="eventDescription" name="eventDescription" rows="3" className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"></textarea>
          </div>
          <div className="mb-6">
            <label htmlFor="eventPrice" className="block text-gray-700 text-sm font-bold mb-2">Price ($):</label>
            <input type="number" id="eventPrice" name="eventPrice" step="0.01" defaultValue="0.00" className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
          </div>
          <button type="submit" className="bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition duration-300 ease-in-out flex items-center justify-center text-sm">
            <PlusCircle className="w-4 h-4 mr-2" /> Add Event
          </button>
        </form>

        {/* Displaying Tickets (for scanning/management) */}
        <h3 className="text-2xl font-semibold text-gray-800 mb-4 mt-8">Tickets Management</h3>
        {tickets.length > 0 ? (
          <div className="bg-gray-50 p-6 rounded-xl shadow-md border border-gray-100 overflow-x-auto">
            <table className="min-w-full bg-white rounded-lg overflow-hidden shadow-sm">
              <thead className="bg-gray-200">
                <tr>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Ticket ID</th>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">QR Code ID</th>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Status</th>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Action</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map(ticket => (
                  <tr key={ticket.id} className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50">
                    <td className="py-3 px-4 text-gray-800">{ticket.id}</td>
                    <td className="py-3 px-4 text-gray-700">{ticket.qrCodeId}</td>
                    <td className="py-3 px-4 text-gray-700">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${ticket.status === 'ISSUED' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                        {ticket.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {ticket.status === 'ISSUED' && (
                        <button
                          onClick={() => handleMarkTicketScanned(ticket.id)}
                          className="bg-purple-600 text-white py-1 px-3 rounded-lg hover:bg-purple-700 transition duration-300 ease-in-out flex items-center justify-center text-xs"
                        >
                          <QrCode className="w-3 h-3 mr-1" /> Mark Scanned
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center text-gray-500 py-8">No tickets issued yet.</p>
        )}
      </div>
    );
  };

  const UserDashboard = () => {
    const userRegistrations = registrations.filter(reg => currentUser && reg.userId === currentUser.username); // Ensure currentUser is not null

    const registeredEventsDetails = userRegistrations.map(reg => {
      const event = events.find(e => e.id === reg.eventId);
      return event ? { ...event, registrationId: reg.id, ticketId: reg.ticketId } : null;
    }).filter(Boolean);

    return (
      <div className="p-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-6">Your Dashboard</h2>

        <h3 className="text-2xl font-semibold text-gray-800 mb-4">Your Registered Events</h3>
        {registeredEventsDetails.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {registeredEventsDetails.map(event => (
              <div key={event.id} className="bg-white p-6 rounded-xl shadow-md border border-gray-100 flex flex-col justify-between">
                <div>
                  <h4 className="text-xl font-bold text-gray-800 mb-2">{event.name}</h4>
                  <p className="text-gray-600 text-sm mb-1"><Calendar className="inline-block w-4 h-4 mr-1" /> {event.date}</p>
                  <p className="text-gray-600 text-sm mb-3"><Home className="inline-block w-4 h-4 mr-1" /> {event.location}</p>
                  <p className="text-gray-700 mb-4 text-sm">{event.description}</p>
                  <p className="text-green-600 font-semibold text-lg"><DollarSign className="inline-block w-5 h-5 mr-1" /> {event.price ? `$${event.price.toFixed(2)}` : 'Free'}</p>
                  {event.ticketId ? (
                    <p className="text-blue-600 text-sm font-semibold flex items-center mt-2"><Ticket className="inline-block w-4 h-4 mr-1" /> Ticket ID: {event.ticketId}</p>
                  ) : (
                    <p className="text-yellow-600 text-sm font-semibold flex items-center mt-2"><XCircle className="inline-block w-4 h-4 mr-1" /> Ticket not yet issued</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500">You haven't registered for any events yet.</p>
        )}
      </div>
    );
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomeView />;
      case 'login':
        return <LoginPage onLogin={handleLogin} onSignUpClick={() => setCurrentPage('signup')} />;
      case 'signup':
        return <SignupPage onSignup={handleSignup} onLoginClick={() => setCurrentPage('login')} />;
      case 'user-dashboard':
        return <UserDashboard />;
      case 'admin-dashboard':
        return <AdminDashboard />;
      default:
        return <HomeView />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Navbar */}
      <nav className="bg-white shadow-sm p-4 flex justify-between items-center border-b border-gray-100">
        <div className="flex items-center">
          <h1 className="text-2xl font-bold text-blue-700">EventFlow</h1>
          <button onClick={() => setCurrentPage('home')} className="ml-6 text-gray-700 hover:text-blue-600 font-medium flex items-center text-sm">
            <Home className="w-4 h-4 mr-1" /> Home
          </button>
        </div>
        <div>
          {currentUser ? (
            <div className="flex items-center space-x-4">
              <span className="text-gray-700 text-sm font-medium">Hello, {currentUser.username} ({currentUser.role})</span>
              {currentUser.role === 'admin' && (
                <button onClick={() => setCurrentPage('admin-dashboard')} className="bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition duration-300 ease-in-out flex items-center text-sm">
                  <BarChart className="w-4 h-4 mr-2" /> Admin Dashboard
                </button>
              )}
              {(currentUser.role === 'attendee' || currentUser.role === 'organizer') && (
                <button onClick={() => setCurrentPage('user-dashboard')} className="bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition duration-300 ease-in-out flex items-center text-sm">
                  <User className="w-4 h-4 mr-2" /> My Dashboard
                </button>
              )}
              <button onClick={handleSignOut} className="bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition duration-300 ease-in-out flex items-center text-sm">
                <LogIn className="w-4 h-4 mr-2" /> Logout
              </button>
            </div>
          ) : (
            <div className="flex space-x-4">
              <button onClick={() => setCurrentPage('login')} className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition duration-300 ease-in-out flex items-center text-sm">
                <LogIn className="w-4 h-4 mr-2" /> Log In
              </button>
              <button onClick={() => setCurrentPage('signup')} className="border border-blue-600 text-blue-600 py-2 px-4 rounded-lg hover:bg-blue-50 transition duration-300 ease-in-out flex items-center text-sm">
                <User className="w-4 h-4 mr-2" /> Sign Up
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-grow">
        {renderPage()}
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white p-4 text-center text-sm">
        <p>&copy; 2025 EventFlow Platform. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default App;