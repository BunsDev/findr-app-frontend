import React, { useState } from "react";
import { BigNumber } from "ethers";
import * as url from "url";

import MarkerLabel = google.maps.MarkerLabel;

export interface RestaurantInfoMarker {
  id?: string;
  position?: google.maps.LatLng;
  name?: string;
  stake?: BigNumber;
  callback?: (id: string) => void;
}

//This is a new React component for adding a custom restaurant marker on the map
export const CustomRestaurantMarker: React.FC<RestaurantInfoMarker> = props => {
  const [marker, setMarker] = React.useState<google.maps.Marker>();

  React.useEffect(() => {
    if (!marker) {
      setMarker(new google.maps.Marker());
    }

    // remove marker from map on unmount
    return () => {
      if (marker) {
        marker.setMap(null);
      }
    };
  }, [marker]);

  React.useEffect(() => {
    if (marker) {
      marker.setPosition(props.position);
      marker.setOptions({
        map: props.map,
      });
      marker.setLabel({
        text: props.name!,
        color: "#36454f",
        fontSize: "22px",
        fontWeight: "bold",
        fontFamily: "Arial",
      });
      marker.setIcon("assets/res_icon.png");
      marker.addListener("click", async () => {
        props.callback!(props.id!);
      });
    }
  }, [marker, props.position]);

  return null;
};
