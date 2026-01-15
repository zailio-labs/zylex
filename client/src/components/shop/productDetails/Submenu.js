import React, { Fragment } from "react";
import { useNavigate } from "react-router-dom"; // Changed from useHistory to useNavigate

const Submenu = (props) => {
  const { categoryId, category, product } = props.value;
  const navigate = useNavigate(); // Changed from useHistory to useNavigate
  return (
    <Fragment>
      {/* Submenu Section */}
      <section className="mx-4 mt-24 md:mx-12 md:mt-32 lg:mt-24">
        <div className="flex justify-between items-center">
          <div className="text-sm flex space-x-2">
            <span
              className="hover:text-yellow-700 cursor-pointer"
              onClick={(e) => navigate("/")} // Changed from history.push to navigate
            >
              Shop
            </span>
            <span
              className="hover:text-yellow-700 cursor-pointer"
              onClick={(e) => navigate(`/products/category/${categoryId}`)} // Changed from history.push to navigate
            >
              {category}
            </span>
            <span className="text-yellow-700 cursor-default">{product}</span>
          </div>
          <div>
            <svg
              className="w-3 h-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 5l7 7-7 7M5 5l7 7-7 7"
              />
            </svg>
          </div>
        </div>
      </section>
      {/* Submenu Section */}
    </Fragment>
  );
};

export default Submenu;
