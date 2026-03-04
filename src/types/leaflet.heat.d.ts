declare module "leaflet.heat" {
  import * as L from "leaflet";
  namespace L {
    function heatLayer(
      latlngs: [number, number, number][],
      options?: Record<string, any>
    ): any;
  }
}
