const AuthLayout = ({children}: {children: React.ReactNode}) => {
  return ( 
    <div className="h-dvh flex items-center justify-center">
      {children}
    </div>
   );
}
 
export default AuthLayout;