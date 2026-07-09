const prisma = require('../utils/prisma');

const createDocument = async (req, res) => {
  const { title } = req.body;
  const ownerId = req.user.id;

  if (!title) {
    return res.status(400).json({ error: 'Document title is required' });
  }

  try {
    const doc = await prisma.document.create({
      data: {
        title,
        content: '# ' + title + '\n\nStart collaborating here...',
        ownerId
      },
      include: {
        owner: {
          select: {
            username: true,
            avatar: true,
            color: true
          }
        }
      }
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: ownerId,
        action: 'CREATE_DOC',
        details: `${req.user.username} created document "${title}"`
      }
    });

    res.status(201).json(doc);
  } catch (error) {
    console.error('Create document error:', error);
    res.status(500).json({ error: 'Server error creating document' });
  }
};

const getDocuments = async (req, res) => {
  try {
    const docs = await prisma.document.findMany({
      include: {
        owner: {
          select: {
            username: true,
            avatar: true,
            color: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });
    res.json(docs);
  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({ error: 'Server error retrieving documents' });
  }
};

const getDocument = async (req, res) => {
  const { id } = req.params;

  try {
    const doc = await prisma.document.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            avatar: true,
            color: true
          }
        },
        history: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 10
        },
        chats: {
          include: {
            user: {
              select: {
                username: true,
                avatar: true,
                color: true
              }
            }
          },
          orderBy: {
            createdAt: 'asc'
          }
        }
      }
    });

    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }

    res.json(doc);
  } catch (error) {
    console.error('Get document error:', error);
    res.status(500).json({ error: 'Server error retrieving document' });
  }
};

const deleteDocument = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const doc = await prisma.document.findUnique({
      where: { id }
    });

    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Allow deleting if user is owner
    if (doc.ownerId !== userId) {
      return res.status(403).json({ error: 'Not authorized to delete this document' });
    }

    await prisma.document.delete({
      where: { id }
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId,
        action: 'DELETE_DOC',
        details: `${req.user.username} deleted document "${doc.title}"`
      }
    });

    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({ error: 'Server error deleting document' });
  }
};

module.exports = {
  createDocument,
  getDocuments,
  getDocument,
  deleteDocument
};
