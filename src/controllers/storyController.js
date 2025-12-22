const Story = require('../models/Story');

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .trim() || 'historia';
}

async function generateUniqueSlug(title, ignoreId) {
  const baseSlug = slugify(title);
  let slug = baseSlug;
  let counter = 2;

  for (;;) {
    const existing = await Story.findOne(
      ignoreId
        ? { slug, _id: { $ne: ignoreId } }
        : { slug }
    ).select('_id');

    if (!existing) {
      return slug;
    }

    slug = `${baseSlug}-${counter}`;
    counter += 1;
  }
}

exports.upsertDraft = async (req, res) => {
  try {
    const userId = req.userId;
    const { title, body } = req.body || {};

    if (!title || typeof title !== 'string') {
      return res.status(400).json({ message: 'Título inválido' });
    }

    if (!body || typeof body !== 'string' || body.length < 500) {
      return res
        .status(400)
        .json({ message: 'El cuerpo debe tener al menos 500 caracteres' });
    }

    let story = await Story.findOne({ user: userId });

    if (!story) {
      const slug = await generateUniqueSlug(title);

      story = await Story.create({
        user: userId,
        title: title.trim(),
        body,
        slug,
        publishedAt: null,
      });

      return res.status(200).json({
        id: story._id,
        title: story.title,
        body: story.body,
        slug: story.slug,
        publishedAt: story.publishedAt,
        createdAt: story.createdAt,
        updatedAt: story.updatedAt,
      });
    }

    if (story.publishedAt) {
      return res
        .status(409)
        .json({ message: 'La historia ya está publicada y no puede editarse' });
    }

    story.title = title.trim();
    story.body = body;
    story.slug = await generateUniqueSlug(title, story._id);

    await story.save();

    return res.status(200).json({
      id: story._id,
      title: story.title,
      body: story.body,
      slug: story.slug,
      publishedAt: story.publishedAt,
      createdAt: story.createdAt,
      updatedAt: story.updatedAt,
    });
  } catch (err) {
    console.error('Error en upsertDraft:', err);
    return res.status(500).json({ message: 'Error al guardar borrador' });
  }
};

exports.getMyStory = async (req, res) => {
  try {
    const userId = req.userId;
    const story = await Story.findOne({ user: userId });

    if (!story) {
      return res.status(404).json({ message: 'Aún no tienes historia' });
    }

    return res.status(200).json({
      id: story._id,
      title: story.title,
      body: story.body,
      slug: story.slug,
      publishedAt: story.publishedAt,
      createdAt: story.createdAt,
      updatedAt: story.updatedAt,
    });
  } catch (err) {
    console.error('Error en getMyStory:', err);
    return res.status(500).json({ message: 'Error al obtener historia' });
  }
};

exports.publishMyStory = async (req, res) => {
  try {
    const userId = req.userId;
    const story = await Story.findOne({ user: userId });

    if (!story) {
      return res.status(400).json({ message: 'No tienes historia para publicar' });
    }

    if (story.publishedAt) {
      return res
        .status(400)
        .json({ message: 'La historia ya está publicada' });
    }

    if (!story.body || story.body.length < 500) {
      return res
        .status(400)
        .json({ message: 'El cuerpo debe tener al menos 500 caracteres' });
    }

    story.publishedAt = new Date();
    await story.save();

    return res.status(200).json({
      id: story._id,
      slug: story.slug,
      publishedAt: story.publishedAt,
    });
  } catch (err) {
    console.error('Error en publishMyStory:', err);
    return res.status(500).json({ message: 'Error al publicar historia' });
  }
};

exports.getPublicStoryBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const story = await Story.findOne({ slug, publishedAt: { $ne: null } });

    if (!story) {
      return res.status(404).json({ message: 'Historia no encontrada' });
    }

    return res.status(200).json({
      title: story.title,
      body: story.body,
      publishedAt: story.publishedAt,
      createdAt: story.createdAt,
    });
  } catch (err) {
    console.error('Error en getPublicStoryBySlug:', err);
    return res.status(500).json({ message: 'Error al obtener historia pública' });
  }
};

exports.listPublicStories = async (req, res) => {
  try {
    const stories = await Story.find({ publishedAt: { $ne: null } })
      .sort({ publishedAt: -1 })
      .select('title slug publishedAt')
      .lean();

    const result = stories.map((story) => ({
      title: story.title,
      slug: story.slug,
      publishedAt: story.publishedAt,
    }));

    return res.status(200).json(result);
  } catch (err) {
    console.error('Error en listPublicStories:', err);
    return res.status(500).json({ message: 'Error al listar historias públicas' });
  }
};
