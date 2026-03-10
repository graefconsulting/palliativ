const axios = require('axios');

/**
 * Holt die gesetzlichen Feiertage für Deutschland (Hessen) für ein bestimmtes Jahr
 * Verwendet die Public API von date.nager.at
 */
const getHolidays = async (req, res) => {
    const { year } = req.query;

    if (!year) {
        return res.status(400).json({ message: 'Jahr ist erforderlich' });
    }

    try {
        // Hole Feiertage für Deutschland
        const response = await axios.get(`https://date.nager.at/api/v3/PublicHolidays/${year}/DE`);

        // Filtere nach bundesweiten Feiertagen und Feiertagen spezifisch für Hessen (DE-HE)
        const hessenHolidays = response.data.filter(holiday => {
            // Entweder bundesweit (counties ist null) oder spezifisch für Hessen (DE-HE) in den counties enthalten
            return !holiday.counties || holiday.counties.includes('DE-HE');
        });

        res.json(hessenHolidays);
    } catch (error) {
        console.error('Error fetching holidays:', error);
        res.status(500).json({ message: 'Fehler beim Abrufen der Feiertage' });
    }
};

module.exports = { getHolidays };
