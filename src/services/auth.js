export const isAuthenticated = () => {
    return !!localStorage.getItem('user');
  };
  
  export const getUserRole = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    return user?.role;
  };
  
  export const login = (user) => {
    localStorage.setItem('user', JSON.stringify(user));
  };
  
  export const logout = () => {
    localStorage.removeItem('user');
  };
  