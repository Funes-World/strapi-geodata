import { getTranslation } from './utils/getTranslation';
import { PLUGIN_ID } from './pluginId';
import { Initializer } from './components/Initializer';
import PluginIcon from './components/PluginIcon';
import * as yup from 'yup';

export default {
  register(app: any) {
    app.customFields.register({
      name: 'geojson',
      pluginId: 'geodata',
      type: 'json', // the geojson will be stored as a json
      intlLabel: {
        id: 'geodata.geojson.label',
        defaultMessage: 'GeoJSON',
      },
      intlDescription: {
        id: 'geodata.geojson.description',
        defaultMessage: 'Allows to save and manage geographic locations, supporting latitude, longitude, and geohash.',
      },
      default: 12,
      isResizable: true,
      icon: PluginIcon,
      components: {
        Input: async () => import('./components/Input'),
      },
      options: {
        base: [
          /*
            Declare settings to be added to the "Base settings" section
            of the field in the Content-Type Builder
          */
          {
            sectionTitle: {
              // Add a "Format" settings section
              id: "geodata.geojson.section.info",
              defaultMessage: "Information about the setup",
            },
            items: [
              // Add settings items to the section
              {
                /*
                  Add a "Color format" dropdown
                  to choose between 2 different format options
                  for the color value: hexadecimal or RGBA
                */
                intlLabel: {
                  id: "geodata.geojson.info.label",
                  defaultMessage: "Only one GeoJSON field is allowed per content type. To store latitude, longitude, and geohash separately for queries, create three fields: lat (float), lng (float), and geohash (string). The plugin automatically updates both the lat/lng fields and the geohash field whenever any of these fields are modified. For dynamic creation, write the GeoJSON field in the {`{lat, lng}`} format, and the related fields will be populated automatically.",
                },
                name: "options.info",
                type: "checkbox",
                value: "ok", // option selected by default
                required: true,
                options: [
                  // List all available "Color format" options
                  {
                    key: "confirm",
                    defaultValue: 'off',
                    value: "on",
                    metadatas: {
                      intlLabel: {
                        id: "geodata.geojson.info.confirm",
                        defaultMessage: "Confirm",
                      },
                    },
                  }
                ],
              },
            ],
          },
        ],
        validator: (args: any) => ({
          info: yup.bool().required({
            id: "geodata.geojson.info.error",
            defaultMessage: "Confirm the understanding of the information",
          }),
        }),
      },
    });

    app.registerPlugin({
      id: PLUGIN_ID,
      initializer: Initializer,
      isReady: false,
      name: PLUGIN_ID,
    });
  },

  async registerTrads(app: any) {
    const { locales } = app;

    const importedTranslations = await Promise.all(
      (locales as string[]).map((locale) => {
        return import(`./translations/${locale}.json`)
          .then(({ default: data }) => {
            return {
              data: getTranslation(data),
              locale,
            };
          })
          .catch(() => {
            return {
              data: {},
              locale,
            };
          });
      })
    );

    return importedTranslations;
  },
};
