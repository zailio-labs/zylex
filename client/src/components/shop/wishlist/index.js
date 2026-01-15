import React, { Fragment } from "react";
import Layout from "../layout";
import SingleWishProduct from "./SingleWishProduct";

const WishList = () => {
  return (
    <Fragment>
      <Layout>
        <SingleWishProduct />
      </Layout>
    </Fragment>
  );
};

export default WishList;
