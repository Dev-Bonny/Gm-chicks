const express = require('express');
const router = express.Router();

// Vaccination schedule data
const vaccinationSchedule = [
  { day: 1, vaccine: 'Marek\'s Disease', method: 'Subcutaneous injection', note: 'Given at hatchery' },
  { day: 7, vaccine: 'Newcastle Disease (ND) + Infectious Bronchitis (IB)', method: 'Eye drop', note: 'Important for respiratory protection' },
  { day: 14, vaccine: 'Gumboro (IBD)', method: 'Drinking water', note: 'First dose' },
  { day: 21, vaccine: 'Newcastle Disease (ND) Booster', method: 'Drinking water', note: 'Booster dose' },
  { day: 28, vaccine: 'Gumboro (IBD) Booster', method: 'Drinking water', note: 'Second dose' },
  { day: 42, vaccine: 'Fowl Pox', method: 'Wing web stab', note: 'For layers only' },
  { day: 56, vaccine: 'Newcastle Disease (ND)', method: 'Intramuscular injection', note: 'For layers - 8 weeks' },
  { day: 112, vaccine: 'Fowl Typhoid', method: 'Intramuscular injection', note: 'For layers - 16 weeks' },
  { day: 119, vaccine: 'Newcastle Disease (ND) + IB + EDS', method: 'Intramuscular injection', note: 'For layers - 17 weeks, before lay' }
];

// @route   GET /api/vaccinations/schedule
// @desc    Get vaccination schedule
// @access  Public
router.get('/schedule', (req, res) => {
  try {
    const { chickType = 'layer' } = req.query;

    let schedule = vaccinationSchedule;

    // Filter based on chick type
    if (chickType === 'broiler') {
      // Broilers typically only need vaccines up to 6 weeks
      schedule = vaccinationSchedule.filter(v => v.day <= 42);
    }

    res.json({
      success: true,
      chickType,
      schedule
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/vaccinations/upcoming
// @desc    Get upcoming vaccinations based on chick age
// @access  Public
router.get('/upcoming', (req, res) => {
  try {
    const { chickAge, chickType = 'layer' } = req.query;

    if (!chickAge) {
      return res.status(400).json({
        success: false,
        message: 'Please provide chick age in days'
      });
    }

    const age = parseInt(chickAge);
    let schedule = vaccinationSchedule;

    if (chickType === 'broiler') {
      schedule = vaccinationSchedule.filter(v => v.day <= 42);
    }

    // Get upcoming vaccinations
    const upcoming = schedule.filter(v => v.day > age);
    const recent = schedule.filter(v => v.day <= age).slice(-2);

    res.json({
      success: true,
      currentAge: age,
      chickType,
      upcomingVaccinations: upcoming,
      recentVaccinations: recent
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/vaccinations/tips
// @desc    Get vaccination tips and best practices
// @access  Public
router.get('/tips', (req, res) => {
  try {
    const tips = [
      {
        title: 'Timing is Critical',
        description: 'Administer vaccines at the exact recommended age for maximum effectiveness.'
      },
      {
        title: 'Storage',
        description: 'Keep vaccines refrigerated at 2-8°C. Never freeze vaccines.'
      },
      {
        title: 'Clean Equipment',
        description: 'Use sterile equipment for each vaccination to prevent contamination.'
      },
      {
        title: 'Water Quality',
        description: 'Use clean, chlorine-free water when administering vaccines through drinking water.'
      },
      {
        title: 'Handling',
        description: 'Handle birds gently during vaccination to reduce stress.'
      },
      {
        title: 'Record Keeping',
        description: 'Maintain detailed records of all vaccinations administered.'
      },
      {
        title: 'Observe Post-Vaccination',
        description: 'Monitor birds closely for 48 hours after vaccination for any adverse reactions.'
      },
      {
        title: 'Professional Guidance',
        description: 'Consult with a veterinarian for specific vaccination protocols.'
      }
    ];

    res.json({
      success: true,
      tips
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;