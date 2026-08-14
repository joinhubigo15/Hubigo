// Cities Hubigo does NOT operate in yet. Matched against a bare, whole-query city-name search
// (e.g. typing "Mumbai" into the search bar) so we can show an explicit "we're not there yet"
// state instead of silently falling through to a normal search — which, since our free-text
// matching can only ever succeed against our own SUPPORTED_CITIES data, would otherwise render a
// generic/misleading "no results" message rather than telling the user why. Deliberately not
// exhaustive of every Indian city — just the ones a real user is likely to type when checking
// whether Hubigo covers their city.
export const OTHER_KNOWN_CITIES: string[] = [
  "Mumbai", "Delhi", "New Delhi", "Kolkata", "Pune", "Ahmedabad", "Jaipur", "Surat", "Lucknow",
  "Kanpur", "Nagpur", "Indore", "Bhopal", "Patna", "Vadodara", "Ghaziabad", "Coimbatore", "Kochi",
  "Cochin", "Visakhapatnam", "Vizag", "Chandigarh", "Guwahati", "Bhubaneswar", "Thiruvananthapuram",
  "Trivandrum", "Mysore", "Mysuru", "Mangalore", "Mangaluru", "Nashik", "Rajkot", "Varanasi",
  "Amritsar", "Ludhiana", "Agra", "Meerut", "Faridabad", "Gurgaon", "Gurugram", "Noida", "Madurai",
  "Ranchi", "Jodhpur", "Raipur", "Dehradun", "Aurangabad", "Vijayawada", "Guntur", "Warangal",
  "Salem", "Tiruchirappalli", "Trichy", "Pondicherry", "Puducherry", "Shimla", "Srinagar", "Jammu",
];
