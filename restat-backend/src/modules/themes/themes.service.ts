import { Injectable } from '@nestjs/common';
import { Themes } from 'src/common/models/themes.model';

@Injectable()
export class ThemesService {
    public async getAllThemes() {
        return await Themes.findAll();
    }

    public async createPresetThemes() {
        const presetThemes = [
            { name: "dark-blue", colors: { primaryColor: "#1A4895" } },
            { name: "yellow", colors: { primaryColor: "#FACA2A" } },
            { name: "red", colors: { primaryColor: "#EE3A23" } },
            { name: "purple", colors: { primaryColor: "#943EFF" } },
            { name: "magenta", colors: { primaryColor: "#CA1EDD" } },
            { name: "light-blue", colors: { primaryColor: "#106FFF" } },
            { name: "cyan", colors: { primaryColor: "#0FF0FF" } },
            { name: "parrot-green", colors: { primaryColor: "#31C228" } },
            { name: "dark", colors: { primaryColor: "#424242" } },
        ]

        const themes = await Themes.findAll({ attributes: ["name"] });
        const themesToCreate = presetThemes.filter((({ name }) => !themes.find(t => t.name === name)));
        await Themes.bulkCreate(themesToCreate);
    }
}
