// @route   DELETE /api/clubs/:type/subclubs/:subclubName
// @desc    Delete a specific subclub
// @access  Private
router.delete('/:type/subclubs/:subclubName', ensureClubExists, async (req, res) => {
  try {
    const { type, subclubName } = req.params;
    const club = req.club;
    
    if (!club) {
      return res.status(404).json({ message: 'Club not found' });
    }
    
    // Find the subclub by name (case insensitive)
    const subclubIndex = club.subclubs.findIndex(s => 
      s.name.toLowerCase() === subclubName.toLowerCase()
    );
    
    if (subclubIndex === -1) {
      return res.status(404).json({ 
        message: `Subclub '${subclubName}' not found in ${club.type} club` 
      });
    }
    
    // Check if user is a coordinator (only coordinators can delete subclubs)
    if (req.student.role !== 'coordinator') {
      return res.status(403).json({ 
        message: 'Only coordinators can delete subclubs' 
      });
    }
    
    // Remove the subclub
    club.subclubs.splice(subclubIndex, 1);
    await club.save();
    
    console.log(`Subclub '${subclubName}' deleted from ${club.type} club by user ${req.student.id}`);
    
    res.status(200).json({
      success: true,
      message: `Successfully deleted '${subclubName}' subclub`
    });
    
  } catch (err) {
    console.error(`Error deleting subclub: ${err.message}`);
    res.status(500).json({ message: 'Server Error' });
  }
}); 