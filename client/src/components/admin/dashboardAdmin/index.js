import React, { Fragment, createContext, useReducer } from "react";
import AdminLayout from "../layout";
import DashboardCard from "./DashboardCard";
import Customize from "./Customize";
import { dashboardState, dashboardReducer } from "./DashboardContext";
import TodaySell from "./TodaySell";

export const DashboardContext = createContext();

const DashboardComponent = () => {
  return (
    <Fragment>
      <DashboardCard />
      <Customize />
      <TodaySell />
    </Fragment>
  );
};

const DashboardAdmin = (props) => {
  const [data, dispatch] = useReducer(dashboardReducer, dashboardState);
  
  // Optional: Memoize context value to prevent unnecessary re-renders
  const contextValue = React.useMemo(() => ({ data, dispatch }), [data, dispatch]);
  
  return (
    <Fragment>
      <DashboardContext.Provider value={contextValue}>
        <AdminLayout>
          <DashboardComponent />
        </AdminLayout>
      </DashboardContext.Provider>
    </Fragment>
  );
};

export default DashboardAdmin;
