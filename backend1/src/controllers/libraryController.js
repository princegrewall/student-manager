const Library = require('../models/Library');

// @desc    Get all library items
// @route   GET /api/library
// @access  Private
exports.getAllLibraryItems = async (req, res) => {
  try {
    // Allow search by title or author
    let query = {};
    if (req.query.search) {
      query = {
        $or: [
          { title: { $regex: req.query.search, $options: 'i' } },
          { author: { $regex: req.query.search, $options: 'i' } }
        ]
      };
    }

    const libraryItems = await Library.find(query)
      .populate({
        path: 'addedBy',
        select: 'name email'
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: libraryItems.length,
      data: libraryItems
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message
    });
  }
};

// @desc    Get library items created by the current user
// @route   GET /api/library/my-uploads
// @access  Private (teachers and coordinators)
exports.getMyLibraryItems = async (req, res) => {
  try {
    // Find items where addedBy matches the current user id
    const libraryItems = await Library.find({ addedBy: req.user.id })
      .populate({
        path: 'addedBy',
        select: 'name email'
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: libraryItems.length,
      data: libraryItems
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message
    });
  }
};

// @desc    Get single library item
// @route   GET /api/library/:id
// @access  Private
exports.getLibraryItem = async (req, res) => {
  try {
    const libraryItem = await Library.findById(req.params.id).populate({
      path: 'addedBy',
      select: 'name email'
    });

    if (!libraryItem) {
      return res.status(404).json({
        success: false,
        message: `No library item with id of ${req.params.id}`
      });
    }

    res.status(200).json({
      success: true,
      data: libraryItem
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message
    });
  }
};

// @desc    Create a new library item
// @route   POST /api/library
// @access  Private
exports.createLibraryItem = async (req, res) => {
  try {
    // Add current user as addedBy
    req.body.addedBy = req.user.id;

    const libraryItem = await Library.create(req.body);

    res.status(201).json({
      success: true,
      data: libraryItem
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message
    });
  }
};

// @desc    Update a library item
// @route   PUT /api/library/:id
// @access  Private (only creator)
exports.updateLibraryItem = async (req, res) => {
  try {
    let libraryItem = await Library.findById(req.params.id);

    if (!libraryItem) {
      return res.status(404).json({
        success: false,
        message: `No library item with id of ${req.params.id}`
      });
    }

    // Make sure user is the creator
    if (libraryItem.addedBy.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to update this library item'
      });
    }

    libraryItem = await Library.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: libraryItem
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message
    });
  }
};

// @desc    Delete a library item
// @route   DELETE /api/library/:id
// @access  Private (only creator)
exports.deleteLibraryItem = async (req, res) => {
  try {
    const libraryItem = await Library.findById(req.params.id);

    if (!libraryItem) {
      return res.status(404).json({
        success: false,
        message: `No library item with id of ${req.params.id}`
      });
    }

    // Make sure user is the creator
    if (libraryItem.addedBy.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to delete this library item'
      });
    }

    await libraryItem.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message
    });
  }
}; 